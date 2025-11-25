// express-serv/routes/recommendations.js
import express from "express";
import db from "../dbfiles/db.js";
import { auth } from "../middleware/auth.js";
import evaluateRules from "../lib/rules.js";

const router = express.Router();

/**
 * GET /api/recommendations/:userId
 * Query:
 *  - docType (optional)
 *  - limit (optional)
 */
router.get("/:userId", auth, async (req, res) => {
  try {
    console.info("[recommendations] called", {
      by: req.user?.id,
      params: req.params,
      query: req.query,
    });

    const userId = Number(req.params.userId);
    if (!userId)
      return res.status(400).json({ ok: false, message: "Invalid user ID" });

    // permission check
    if (req.user.id !== userId && req.user.role !== "admin") {
      console.warn("[recommendations] unauthorized", {
        requestedFor: userId,
        by: req.user.id,
      });
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    const docTypeFilter = req.query.docType ? String(req.query.docType) : null;
    const limit = Math.min(200, Number(req.query.limit) || 100);

    // fetch records
    console.info("[recommendations] fetching records", {
      userId,
      docTypeFilter,
      limit,
    });
    let rows;
    if (docTypeFilter) {
      rows = await db.all(
        `SELECT * FROM records WHERE user_id = ? AND doctype = ? ORDER BY date DESC, created_at DESC LIMIT ?`,
        [userId, docTypeFilter, limit]
      );
    } else {
      rows = await db.all(
        `SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?`,
        [userId, limit]
      );
    }

    if (!rows || rows.length === 0) {
      console.info("[recommendations] no records found");
      return res.json({ ok: true, recommendations: [] });
    }

    // run rules per record
    const recs = [];
    for (const r of rows) {
      let docinfo = {};
      try {
        docinfo = r.docinfo
          ? typeof r.docinfo === "string"
            ? JSON.parse(r.docinfo)
            : r.docinfo
          : {};
      } catch (e) {
        console.warn(
          "[recommendations] parse docinfo failed for record",
          r.id,
          e
        );
        docinfo = {};
      }
      const out = evaluateRules({
        record: r,
        docinfo,
        docType: r.doctype,
        userId,
      });
      for (const o of out) {
        if (o && typeof o === "object") {
          o.recordId = r.id;
          recs.push(o);
        }
      }
    }

    console.info("[recommendations] raw recs count:", recs.length);

    // dedupe
    const unique = [];
    const seen = new Set();
    for (const r of recs) {
      const key = `${r.rule}::${r.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }

    // sort by severity
    const order = { urgent: 0, warn: 1, info: 2 };
    unique.sort((a, b) => (order[a.level] ?? 3) - (order[b.level] ?? 3));

    const outFinal = unique.slice(0, Number(req.query.limit) || 50);
    console.info("[recommendations] returning", outFinal.length);
    return res.json({ ok: true, recommendations: outFinal });
  } catch (err) {
    console.error("[recommendations] error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
