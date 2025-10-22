// express-serv/routes/records.js
import express from "express";
import db from "../dbfiles/db.js"; // <-- IMPORT SHARED DB
import { auth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/records -> records for current user
router.get("/", auth, async (req, res) => {
  // <-- Added async
  try {
    const userId = req.user.id;
    const rows = await db.all(
      // <-- Changed to await
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

// GET /api/records/:id -> single record (only owner or admin)
router.get("/:id", auth, async (req, res) => {
  // <-- Added async
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const recordId = req.params.id;

    const row = await db.get(
      // <-- Changed to await
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

// POST /api/records -> create new record for current user
router.post("/", auth, async (req, res) => {
  // <-- Added async
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

  try {
    const result = await db.run(
      // <-- Changed to await
      sql,
      [
        userId,
        record_title,
        description || "",
        date,
        doctor_name,
        hospital_name,
        file_url,
      ]
    );

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

// DELETE /api/records/:id -> delete (owner or admin)
router.delete("/:id", auth, async (req, res) => {
  // <-- Added async
  console.log("DELETE /records/:id called, id =", req.params.id);
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";
  const recordId = req.params.id;

  try {
    // verify existence and ownership
    const row = await db.get("SELECT user_id FROM records WHERE id = ?", [
      recordId,
    ]); // <-- Changed to await

    if (!row) return res.status(404).json({ ok: false, message: "Not found" });
    if (!isAdmin && row.user_id !== userId)
      return res.status(403).json({ ok: false, message: "Forbidden" });

    // Perform the delete
    const result = await db.run("DELETE FROM records WHERE id = ?", [recordId]); // <-- Changed to await

    if (result.changes === 0)
      return res.status(404).json({ ok: false, message: "Record not found" });

    res.json({ ok: true, deletedId: Number(recordId) });
  } catch (err) {
    console.error(`DELETE /records/${recordId} error:`, err.message);
    return res.status(500).json({ ok: false, message: "DB delete error" });
  }
});

export default router;
