// express-serv/routes/chat.js
import express from "express";
import db from "../dbfiles/db.js";
import { auth } from "../middleware/auth.js";
import evaluateRules from "../lib/rules.js";

const router = express.Router();

/**
 * POST /api/chat/memory
 * Body: { key, value }
 * Creates or updates a memory entry for the authenticated user
 */
router.post("/memory", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    const { key, value } = req.body || {};
    if (!key)
      return res.status(400).json({ ok: false, message: "Missing key" });

    const strVal =
      value === undefined || value === null
        ? null
        : String(value).slice(0, 5000);

    const upd = await db.run(
      `UPDATE memories SET value=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND key=?`,
      [strVal, userId, key]
    );

    if (upd && upd.changes) {
      return res.json({ ok: true, updated: true });
    }

    await db.run(
      `INSERT INTO memories (user_id, key, value) VALUES (?, ?, ?)`,
      [userId, key, strVal]
    );

    return res.json({ ok: true, inserted: true });
  } catch (err) {
    console.error("[chat/memory POST] error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/**
 * GET /api/chat/memory/:userId
 * Query: ?key=...
 */
router.get("/memory/:userId", auth, async (req, res) => {
  try {
    const uid = Number(req.params.userId);
    if (!uid)
      return res.status(400).json({ ok: false, message: "Invalid user id" });

    if (req.user.id !== uid && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    const key = req.query.key ? String(req.query.key) : null;
    if (key) {
      const row = await db.get(
        `SELECT key, value, updated_at FROM memories WHERE user_id=? AND key=?`,
        [uid, key]
      );
      return res.json({ ok: true, memory: row || null });
    }

    const rows = await db.all(
      `SELECT key, value, updated_at FROM memories WHERE user_id=? ORDER BY updated_at DESC`,
      [uid]
    );
    return res.json({ ok: true, memories: rows || [] });
  } catch (err) {
    console.error("[chat/memory GET] error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/**
 * POST /api/chat/log
 * Body: { sessionId?, direction: 'user'|'bot', message, meta? }
 */
router.post("/log", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    const {
      sessionId = null,
      direction = "user",
      message = "",
      meta = null,
    } = req.body || {};
    if (!message)
      return res.status(400).json({ ok: false, message: "Missing message" });

    await db.run(
      `INSERT INTO chat_logs (user_id, session_id, direction, message, meta) VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        sessionId,
        direction,
        String(message).slice(0, 8000),
        meta ? JSON.stringify(meta).slice(0, 8000) : null,
      ]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("[chat/log] error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/**
 * POST /api/chat/respond
 * Body: { sessionId?, message }
 */
router.post("/respond", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    const text = String(req.body?.message || "").trim();
    if (!text)
      return res.status(400).json({ ok: false, message: "Missing message" });

    // Recommend
    if (/recommend/i.test(text)) {
      const recs = await db.all(
        `SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 100`,
        [userId]
      );

      const recOut = [];
      for (const r of recs) {
        let docinfo = {};
        try {
          docinfo = r.docinfo
            ? typeof r.docinfo === "string"
              ? JSON.parse(r.docinfo)
              : r.docinfo
            : {};
        } catch (e) {
          docinfo = {};
        }
        const out = evaluateRules({
          record: r,
          docinfo,
          docType: r.doctype,
          userId,
        });
        for (const o of out) {
          o.recordId = r.id;
          recOut.push(o);
        }
      }

      const messages = [
        { type: "text", text: `Found ${recOut.length} recommendation(s).` },
        { type: "list_recommendations", items: recOut.slice(0, 50) },
        {
          type: "quick_replies",
          options: [{ id: "view_all", label: "View recommendations" }],
        },
      ];

      return res.json({ ok: true, messages });
    }

    // Recent
    if (/recent/i.test(text)) {
      const rows = await db.all(
        `SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 10`,
        [userId]
      );
      return res.json({
        ok: true,
        messages: [
          { type: "text", text: `Found ${rows.length} recent record(s).` },
          { type: "recent_records", records: rows },
          {
            type: "quick_replies",
            options: [{ id: "open_records", label: "Open records" }],
          },
        ],
      });
    }

    // fallback
    return res.json({
      ok: true,
      messages: [
        {
          type: "text",
          text: "I didn't fully understand — try 'Recommend me' or 'Show recent tests'.",
        },
        {
          type: "quick_replies",
          options: [
            { id: "recommend", label: "Recommend me" },
            { id: "recent", label: "Show recent tests" },
          ],
        },
      ],
    });
  } catch (err) {
    console.error("[chat/respond] error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
