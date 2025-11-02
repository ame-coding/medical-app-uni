import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../dbfiles/db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

const baseUploadDir = path.join(process.cwd(), "userfiles", "uploads");
if (!fs.existsSync(baseUploadDir)) fs.mkdirSync(baseUploadDir, { recursive: true });

// --- Configure Multer ---
const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    const userId = req.user?.id ?? "unknown";
    const userDir = path.join(baseUploadDir, String(userId));
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

function fileKeyToPath(key) {
  return key ? path.join(baseUploadDir, key) : null;
}

// --- GET /records (all for user) ---
router.get("/", auth, async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT id, user_id, record_title, description, date, doctor_name, hospital_name,
              doctype, docinfo, file_url, created_at
       FROM records
       WHERE user_id = ?
       ORDER BY date DESC, created_at DESC`,
      [req.user.id]
    );

    const host = `${req.protocol}://${req.get("host")}`;

    const formatted = rows.map((r) => {
      let parsedInfo = {};
      try {
        parsedInfo = r.docinfo ? JSON.parse(r.docinfo) : {};
      } catch {}
      const absUrl = r.file_url ? `${host}/uploads/${r.file_url}` : null;
      const missing = r.file_url ? !fs.existsSync(fileKeyToPath(r.file_url)) : false;

      return {
        ...r,
        docinfo: parsedInfo,
        file_url: absUrl, // send absolute URL only in API response
        file_missing: missing,
      };
    });

    res.json({ ok: true, records: formatted });
  } catch (err) {
    console.error("GET /records error:", err);
    res.status(500).json({ ok: false, message: "Database error" });
  }
});

// --- GET /records/:id ---
router.get("/:id", auth, async (req, res) => {
  try {
    const record = await db.get(`SELECT * FROM records WHERE id=?`, [req.params.id]);
    if (!record) return res.status(404).json({ ok: false, message: "Not found" });
    if (record.user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const host = `${req.protocol}://${req.get("host")}`;
    try {
      record.docinfo = record.docinfo ? JSON.parse(record.docinfo) : {};
    } catch {
      record.docinfo = {};
    }

    record.file_missing = record.file_url
      ? !fs.existsSync(fileKeyToPath(record.file_url))
      : false;

    record.file_url = record.file_url
      ? `${host}/uploads/${record.file_url}`
      : null;

    res.json({ ok: true, record });
  } catch (err) {
    console.error("GET /records/:id error:", err);
    res.status(500).json({ ok: false, message: "Database error" });
  }
});

// --- POST /records/upload ---
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

  if (!record_title || !date)
    return res.status(400).json({ ok: false, message: "Title and date required" });

  try {
    const fileKey = req.file ? `${userId}/${req.file.filename}` : null;

    const result = await db.run(
      `INSERT INTO records
       (user_id, record_title, description, date, doctor_name, hospital_name, doctype, docinfo, file_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        record_title,
        description || "",
        date,
        doctor_name || "",
        hospital_name || "",
        doctype || null,
        docinfo || "{}",
        fileKey,
      ]
    );

    res.status(201).json({
      ok: true,
      record: {
        id: result.lastID,
        user_id: userId,
        record_title,
        description,
        date,
        doctor_name,
        hospital_name,
        doctype,
        docinfo: JSON.parse(docinfo || "{}"),
        file_url: fileKey ? `${req.protocol}://${req.get("host")}/uploads/${fileKey}` : null,
      },
    });
  } catch (err) {
    console.error("POST /records/upload error:", err);
    res.status(500).json({ ok: false, message: "Insert failed" });
  }
});

// --- PUT /records/:id ---
router.put("/:id", auth, upload.single("file"), async (req, res) => {
  const recordId = req.params.id;
  const userId = req.user.id;
  const { remove_file } = req.body;

  try {
    const existing = await db.get(`SELECT * FROM records WHERE id=?`, [recordId]);
    if (!existing) return res.status(404).json({ ok: false, message: "Not found" });
    if (existing.user_id !== userId && req.user.role !== "admin")
      return res.status(403).json({ ok: false, message: "Forbidden" });

    if (remove_file === "true" || req.file) {
      const oldPath = existing.file_url ? fileKeyToPath(existing.file_url) : null;
      if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    let newKey = existing.file_url;
    if (req.file) newKey = `${userId}/${req.file.filename}`;
    else if (remove_file === "true") newKey = null;

    const updated = {
      record_title: req.body.record_title ?? existing.record_title,
      description: req.body.description ?? existing.description,
      date: req.body.date ?? existing.date,
      doctor_name: req.body.doctor_name ?? existing.doctor_name,
      hospital_name: req.body.hospital_name ?? existing.hospital_name,
      doctype: req.body.doctype ?? existing.doctype,
      docinfo: req.body.docinfo ?? existing.docinfo,
      file_url: newKey,
    };

    await db.run(
      `UPDATE records
       SET record_title=?, description=?, date=?, doctor_name=?, hospital_name=?, doctype=?, docinfo=?, file_url=?
       WHERE id=?`,
      [
        updated.record_title,
        updated.description,
        updated.date,
        updated.doctor_name,
        updated.hospital_name,
        updated.doctype,
        updated.docinfo,
        updated.file_url,
        recordId,
      ]
    );

    res.json({
      ok: true,
      record: {
        id: Number(recordId),
        ...updated,
        file_url: updated.file_url
          ? `${req.protocol}://${req.get("host")}/uploads/${updated.file_url}`
          : null,
      },
    });
  } catch (err) {
    console.error("PUT /records/:id error:", err);
    res.status(500).json({ ok: false, message: "Update failed" });
  }
});

// --- DELETE /records/:id ---
router.delete("/:id", auth, async (req, res) => {
  try {
    const record = await db.get(`SELECT * FROM records WHERE id=?`, [req.params.id]);
    if (!record) return res.status(404).json({ ok: false, message: "Not found" });
    if (record.user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ ok: false, message: "Forbidden" });

    if (record.file_url) {
      const filePath = fileKeyToPath(record.file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.run(`DELETE FROM records WHERE id=?`, [req.params.id]);
    res.json({ ok: true, deletedId: Number(req.params.id) });
  } catch (err) {
    console.error("DELETE /records/:id error:", err);
    res.status(500).json({ ok: false, message: "Delete failed" });
  }
});

// --- GET /records/download/:id (auth required) ---
router.get("/download/:id", auth, async (req, res) => {
  try {
    const record = await db.get(`SELECT * FROM records WHERE id=?`, [req.params.id]);
    if (!record) return res.status(404).json({ ok: false, message: "Not found" });
    if (record.user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const filePath = fileKeyToPath(record.file_url);
    if (!filePath || !fs.existsSync(filePath))
      return res.status(404).json({ ok: false, message: "File not found" });

    res.download(filePath, path.basename(filePath));
  } catch (err) {
    console.error("GET /records/download/:id error:", err);
    res.status(500).json({ ok: false, message: "Download failed" });
  }
});

export default router;
