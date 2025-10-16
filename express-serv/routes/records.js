// express-serv/routes/records.js
import express from "express";
import sqlite3 from "sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auth } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../dbfiles/app.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Failed to open DB:", err.message);
});

// GET /api/records -> records for current user
router.get("/", auth, (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT id, user_id, record_title, description, date, doctor_name, hospital_name, file_url, created_at
     FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      res.json({ ok: true, records: rows || [] });
    }
  );
});

// GET /api/records/:id -> single record (only owner or admin)
router.get("/:id", auth, (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";
  const recordId = req.params.id;

  db.get(
    `SELECT id, user_id, record_title, description, date, doctor_name, hospital_name, file_url, created_at
     FROM records WHERE id = ?`,
    [recordId],
    (err, row) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!row)
        return res.status(404).json({ ok: false, message: "Not found" });
      if (!isAdmin && row.user_id !== userId)
        return res.status(403).json({ ok: false, message: "Forbidden" });
      res.json({ ok: true, record: row });
    }
  );
});

// POST /api/records -> create new record for current user
router.post("/", auth, (req, res) => {
  const userId = req.user.id;
  const {
    record_title,
    description,
    date,
    doctor_name = null,
    hospital_name = null,
    file_url = null,
  } = req.body || {};

  if (!record_title || !date) {
    return res
      .status(400)
      .json({ ok: false, message: "record_title and date are required" });
  }

  const sql =
    "INSERT INTO records (user_id, record_title, description, date, doctor_name, hospital_name, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.run(
    sql,
    [
      userId,
      record_title,
      description || "",
      date,
      doctor_name,
      hospital_name,
      file_url,
    ],
    function (err) {
      if (err)
        return res.status(500).json({ ok: false, message: "DB insert error" });
      const created = {
        id: this.lastID,
        user_id: userId,
        record_title,
        description,
        date,
        doctor_name,
        hospital_name,
        file_url,
      };
      res.status(201).json({ ok: true, record: created });
    }
  );
});

// DELETE /api/records/:id -> delete (owner or admin)
router.delete("/:id", auth, (req, res) => {
  console.log("DELETE /records/:id called, id =", req.params.id);
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";
  const recordId = req.params.id;

  // verify existence and ownership
  db.get("SELECT user_id FROM records WHERE id = ?", [recordId], (err, row) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (!row) return res.status(404).json({ ok: false, message: "Not found" });
    if (!isAdmin && row.user_id !== userId)
      return res.status(403).json({ ok: false, message: "Forbidden" });

    db.run("DELETE FROM records WHERE id = ?", [recordId], function (delErr) {
      if (delErr)
        return res.status(500).json({ ok: false, message: "DB delete error" });

      // this.changes should be 1 if deleted
      if (this.changes === 0)
        return res.status(404).json({ ok: false, message: "Record not found" });

      res.json({ ok: true, deletedId: Number(recordId) });
    });
  });
});

export default router;
