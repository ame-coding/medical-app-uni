// express-serv/routes/reminders.js
import express from "express";
import { auth } from "../middleware/auth.js";
import db from "../dbfiles/db.js";

const router = express.Router();

/**
 * List upcoming active reminders
 */
router.get("/", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log("GET /reminders for user", userId);
    const rows = await db.all(
      `SELECT * FROM reminders
       WHERE user_id = ? AND is_active = 1 AND datetime(date_time) >= datetime('now')
       ORDER BY date_time`,
      [userId]
    );
    res.json({ ok: true, reminders: rows || [] });
  } catch (err) {
    console.error("GET /reminders error:", err);
    next(err);
  }
});

/**
 * Get single reminder by id (for edit screen)
 */
router.get("/:id", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    console.log("GET /reminders/:id", { userId, id });
    const row = await db.get(
      "SELECT * FROM reminders WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (!row)
      return res.status(404).json({ ok: false, message: "Reminder not found" });
    res.json({ ok: true, reminder: row });
  } catch (err) {
    console.error("GET /reminders/:id error:", err);
    next(err);
  }
});

/**
 * Create reminder (scheduler removed)
 */
router.post("/", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description = null,
      date_time,
      repeat_interval = null,
    } = req.body;
    if (!title || !date_time)
      return res
        .status(400)
        .json({ ok: false, message: "title and date_time are required" });

    const date_time_iso = new Date(date_time).toISOString();

    const result = await db.run(
      `INSERT INTO reminders (user_id, title, description, date_time, repeat_interval)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, description, date_time_iso, repeat_interval]
    );

    const newRow = await db.get("SELECT * FROM reminders WHERE id = ?", [
      result.lastID,
    ]);
    if (!newRow)
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch new reminder" });

    res.json({ ok: true, reminder: newRow });
  } catch (err) {
    console.error("POST /reminders error:", err);
    next(err);
  }
});

/**
 * Update reminder
 */
router.put("/:id", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const allowed = [
      "title",
      "description",
      "date_time",
      "repeat_interval",
      "is_active",
      "notification_id",
    ];
    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        let value = req.body[key];
        if (key === "date_time") value = new Date(value).toISOString();
        sets.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (sets.length === 0)
      return res
        .status(400)
        .json({ ok: false, message: "No fields to update" });

    sets.push("updated_at = CURRENT_TIMESTAMP");
    const sql = `UPDATE reminders SET ${sets.join(
      ", "
    )} WHERE user_id = ? AND id = ?`;
    params.push(userId, id);

    console.log("PUT /reminders/:id SQL:", sql, "params:", params);
    const result = await db.run(sql, params);
    if (!result.changes)
      return res.status(404).json({ ok: false, message: "Reminder not found" });

    const updated = await db.get("SELECT * FROM reminders WHERE id = ?", [id]);
    res.json({ ok: true, reminder: updated });
  } catch (err) {
    console.error("PUT /reminders/:id error:", err);
    next(err);
  }
});

/**
 * Soft-delete reminder
 */
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    console.log("DELETE /reminders/:id", { userId, id });

    const result = await db.run(
      `UPDATE reminders SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`,
      [userId, id]
    );

    if (!result.changes)
      return res.status(404).json({ ok: false, message: "Reminder not found" });

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /reminders/:id error:", err);
    next(err);
  }
});

export default router;
