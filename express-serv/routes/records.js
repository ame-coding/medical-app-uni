// express-serv/routes/records.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../dbfiles/db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const uploadRoot = path.join(process.cwd(), "userfiles", "uploads");
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(uploadRoot, String(req.user.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${name}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const fileKeyPath = (key) => (key ? path.join(uploadRoot, key) : null);
const fileKey = (req) =>
  req.file ? `${req.user.id}/${req.file.filename}` : null;

// ---------- GET RECENT (for a user) ----------
router.get("/:userId/recent", auth, async (req, res) => {
  try {
    console.info("[records] GET /:userId/recent called", {
      user: req.user?.id,
      params: req.params,
      query: req.query,
    });
    const userId = Number(req.params.userId);
    if (!userId) {
      console.warn("[records] invalid userId param", req.params.userId);
      return res.status(400).json({ ok: false, message: "Invalid user ID" });
    }

    if (req.user.id !== userId && req.user.role !== "admin") {
      console.warn("[records] unauthorized recent request", {
        requestedFor: userId,
        by: req.user.id,
      });
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    const limit = Math.min(50, Number(req.query.limit) || 10);
    const rows = await db.all(
      `SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?`,
      [userId, limit]
    );
    console.info("[records] recent rows fetched:", rows ? rows.length : 0);

    const host = `${req.protocol}://${req.get("host")}`;
    const formatted = rows.map((r) => {
      let docinfo = {};
      try {
        docinfo = r.docinfo
          ? typeof r.docinfo === "string"
            ? JSON.parse(r.docinfo)
            : r.docinfo
          : {};
      } catch (e) {
        console.warn("[records] failed to parse docinfo for record", r.id, e);
        docinfo = {};
      }
      return {
        ...r,
        docinfo,
        file_missing: r.file_url
          ? !fs.existsSync(fileKeyPath(r.file_url))
          : false,
        file_url: r.file_url ? `${host}/api/uploads/${r.file_url}` : null,
      };
    });

    res.json({ ok: true, records: formatted });
  } catch (err) {
    console.error("[records] recent error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Server error loading recent records" });
  }
});

// ---------- GET ALL ----------
router.get("/", auth, async (req, res) => {
  try {
    console.info("[records] GET / called by user", req.user?.id);
    const rows = await db.all(
      `SELECT * FROM records WHERE user_id=? ORDER BY date DESC, created_at DESC`,
      [req.user.id]
    );
    console.info("[records] total rows fetched:", rows ? rows.length : 0);

    const host = `${req.protocol}://${req.get("host")}`;
    res.json({
      ok: true,
      records: rows.map((r) => {
        let docinfo = {};
        try {
          docinfo = r.docinfo
            ? typeof r.docinfo === "string"
              ? JSON.parse(r.docinfo)
              : r.docinfo
            : {};
        } catch (e) {
          console.warn("[records] parse docinfo error for record", r.id, e);
          docinfo = {};
        }
        return {
          ...r,
          docinfo,
          file_missing: r.file_url
            ? !fs.existsSync(fileKeyPath(r.file_url))
            : false,
          file_url: r.file_url ? `${host}/api/uploads/${r.file_url}` : null,
        };
      }),
    });
  } catch (e) {
    console.error("[records] list error:", e);
    res.status(500).json({ ok: false });
  }
});

// ---------- GET SINGLE ----------
router.get("/:id", auth, async (req, res) => {
  try {
    console.info("[records] GET /:id called", {
      id: req.params.id,
      user: req.user?.id,
    });
    const r = await db.get(`SELECT * FROM records WHERE id=?`, [req.params.id]);
    if (!r) {
      console.warn("[records] record not found", req.params.id);
      return res.status(404).json({ ok: false });
    }
    if (r.user_id !== req.user.id && req.user.role !== "admin") {
      console.warn("[records] unauthorized access to record", {
        recordUser: r.user_id,
        by: req.user.id,
      });
      return res.status(403).json({ ok: false });
    }

    const host = `${req.protocol}://${req.get("host")}`;
    r.docinfo = r.docinfo
      ? typeof r.docinfo === "string"
        ? JSON.parse(r.docinfo)
        : r.docinfo
      : {};
    r.file_missing = r.file_url
      ? !fs.existsSync(fileKeyPath(r.file_url))
      : false;
    r.file_url = r.file_url ? `${host}/api/uploads/${r.file_url}` : null;
    res.json({ ok: true, record: r });
  } catch (e) {
    console.error("[records] get error:", e);
    res.status(500).json({ ok: false });
  }
});

// ---------- CREATE ----------
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  const userId = req.user.id;
  const {
    record_title,
    description,
    date,
    doctor_name,
    hospital_name,
    doctype,
    docinfo,
  } = req.body;
  console.info("[records] POST /upload called by", userId, {
    record_title,
    doctype,
    date,
  });
  if (!record_title || !date)
    return res
      .status(400)
      .json({ ok: false, message: "Title and date required" });
  try {
    const file = fileKey(req);
    const r = await db.run(
      `INSERT INTO records (user_id, record_title, description, date, doctor_name, hospital_name, doctype, docinfo, file_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        record_title,
        description || "",
        date,
        doctor_name || "",
        hospital_name || "",
        doctype || "",
        docinfo || "{}",
        file,
      ]
    );
    console.info("[records] inserted record id", r.lastID);
    res.status(201).json({ ok: true, id: r.lastID });
  } catch (e) {
    console.error("[records] upload error:", e);
    res.status(500).json({ ok: false });
  }
});

// ---------- UPDATE ----------
router.put("/:id", auth, upload.single("file"), async (req, res) => {
  try {
    console.info("[records] PUT /:id called", {
      id: req.params.id,
      by: req.user?.id,
    });
    const old = await db.get(`SELECT * FROM records WHERE id=?`, [
      req.params.id,
    ]);
    if (!old) {
      console.warn("[records] update: record not found", req.params.id);
      return res.status(404).json({ ok: false });
    }
    if (old.user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ ok: false });

    if (req.file || req.body.remove_file === "true") {
      const oldPath = old.file_url ? fileKeyPath(old.file_url) : null;
      if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const newKey = req.file
      ? fileKey(req)
      : req.body.remove_file === "true"
      ? null
      : old.file_url;

    await db.run(
      `UPDATE records SET record_title=?, description=?, date=?, doctor_name=?, hospital_name=?, doctype=?, docinfo=?, file_url=? WHERE id=?`,
      [
        req.body.record_title || old.record_title,
        req.body.description || old.description,
        req.body.date || old.date,
        req.body.doctor_name || old.doctor_name,
        req.body.hospital_name || old.hospital_name,
        req.body.doctype || old.doctype,
        req.body.docinfo || old.docinfo,
        newKey,
        req.params.id,
      ]
    );
    console.info("[records] updated record", req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("[records] update error:", e);
    res.status(500).json({ ok: false });
  }
});

// ---------- DOWNLOAD ----------
router.get("/download/:id", auth, async (req, res) => {
  try {
    console.info("[records] GET /download/:id called", {
      id: req.params.id,
      by: req.user?.id,
    });
    const r = await db.get(`SELECT * FROM records WHERE id=?`, [req.params.id]);
    if (!r) return res.status(404).json({ ok: false });
    if (r.user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ ok: false });
    const f = fileKeyPath(r.file_url);
    if (!r.file_url || !fs.existsSync(f))
      return res.status(404).json({ ok: false, message: "File not found" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(f)}"`
    );
    res.download(f);
  } catch (e) {
    console.error("[records] download error:", e);
    res.status(500).json({ ok: false });
  }
});

// ---------- DELETE ----------
router.delete("/:id", auth, async (req, res) => {
  try {
    console.info("[records] DELETE /:id called", {
      id: req.params.id,
      by: req.user?.id,
    });
    const id = req.params.id;
    const record = await db.get(`SELECT * FROM records WHERE id=?`, [id]);
    if (!record)
      return res.status(404).json({ ok: false, message: "Record not found" });
    if (record.user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ ok: false, message: "Unauthorized" });

    if (record.file_url) {
      const filePath = path.join(uploadRoot, record.file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.run(`DELETE FROM records WHERE id=?`, [id]);
    console.info("[records] deleted record", id);
    res.json({ ok: true, message: "Record deleted successfully" });
  } catch (err) {
    console.error("[records] Delete error:", err);
    res.status(500).json({ ok: false, message: "Server error during delete" });
  }
});

export default router;
