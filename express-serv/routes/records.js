// express-serv/routes/records.js
import express from "express";
import db from "../dbfiles/db.js"; // shared sqlite wrapper
import { auth } from "../middleware/auth.js";

const router = express.Router();

// GET / -> list user's records
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await db.all(
      `SELECT id, user_id, record_title, description, date, doctor_name, hospital_name, file_url, created_at
       FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC`,
      [userId]
    );
    res.json({ ok: true, records: rows || [] });
  } catch (err) {
    console.error("GET /records error:", err.message);
    return res.status(500).json({ ok: false, message: "DB error" });
  }
});

// GET /:id -> fetch single record
router.get("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const recordId = Number(req.params.id);

    const row = await db.get(
      `SELECT id, user_id, record_title, description, date, doctor_name, hospital_name, file_url, created_at
       FROM records WHERE id = ?`,
      [recordId]
    );

    if (!row) return res.status(404).json({ ok: false, message: "Not found" });
    if (!isAdmin && row.user_id !== userId)
      return res.status(403).json({ ok: false, message: "Forbidden" });

    res.json({ ok: true, record: row });
  } catch (err) {
    console.error(`GET /records/${req.params.id} error:`, err.message);
    return res.status(500).json({ ok: false, message: "DB error" });
  }
});

// POST / -> create
router.post("/", auth, async (req, res) => {
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

  try {
    const sql =
      "INSERT INTO records (user_id, record_title, description, date, doctor_name, hospital_name, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const result = await db.run(sql, [
      userId,
      record_title,
      description || "",
      date,
      doctor_name,
      hospital_name,
      file_url,
    ]);

    const created = {
      id: result.lastID,
      user_id: userId,
      record_title,
      description,
      date,
      doctor_name,
      hospital_name,
      file_url,
    };
    res.status(201).json({ ok: true, record: created });
  } catch (err) {
    console.error("POST /records error:", err.message);
    return res.status(500).json({ ok: false, message: "DB insert error" });
  }
});

// PUT /:id -> update record (owner or admin)
router.put("/:id", auth, async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";
  const recordId = Number(req.params.id);

  try {
    // check existence & ownership
    const existing = await db.get("SELECT user_id FROM records WHERE id = ?", [
      recordId,
    ]);
    if (!existing)
      return res.status(404).json({ ok: false, message: "Not found" });
    if (!isAdmin && existing.user_id !== userId)
      return res.status(403).json({ ok: false, message: "Forbidden" });

    // allowed fields to update
    const allowed = [
      "record_title",
      "description",
      "date",
      "doctor_name",
      "hospital_name",
      "file_url",
    ];
    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    }

    if (sets.length === 0)
      return res
        .status(400)
        .json({ ok: false, message: "No fields to update" });

    // update timestamp too
    sets.push("created_at = created_at"); // keep created_at
    // add updated_at if table has it; we'll attempt to set it if column exists (best-effort)
    // But not required — you can add updated_at column later.

    const sql = `UPDATE records SET ${sets.join(", ")} WHERE id = ?`;
    params.push(recordId);

    console.log("PUT /records/:id SQL:", sql, "params:", params);
    const result = await db.run(sql, params);

    if (!result.changes)
      return res.status(404).json({ ok: false, message: "Record not found" });

    const updated = await db.get(
      `SELECT id, user_id, record_title, description, date, doctor_name, hospital_name, file_url, created_at
       FROM records WHERE id = ?`,
      [recordId]
    );

    res.json({ ok: true, record: updated });
  } catch (err) {
    console.error(`PUT /records/${recordId} error:`, err.message || err);
    return res.status(500).json({ ok: false, message: "DB update error" });
  }
});

// DELETE /:id -> delete (owner or admin)
router.delete("/:id", auth, async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";
  const recordId = req.params.id;

  try {
    const row = await db.get("SELECT user_id FROM records WHERE id = ?", [
      recordId,
    ]);

    if (!row) return res.status(404).json({ ok: false, message: "Not found" });
    if (!isAdmin && row.user_id !== userId)
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const result = await db.run("DELETE FROM records WHERE id = ?", [recordId]);
    if (result.changes === 0)
      return res.status(404).json({ ok: false, message: "Record not found" });

    res.json({ ok: true, deletedId: Number(recordId) });
  } catch (err) {
    console.error(`DELETE /records/${recordId} error:`, err.message);
    return res.status(500).json({ ok: false, message: "DB delete error" });
  }
});

export default router;
