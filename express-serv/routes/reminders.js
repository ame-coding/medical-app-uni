// express-serv/routes/reminders.js
import express from "express";
import { auth } from "../middleware/auth.js";
import db from "../dbfiles/db.js";
// --- DELETE THIS ---
// import scheduler from "../notifications/scheduler.js";

const router = express.Router();

// GET route is unchanged
router.get("/", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rows = await db.all(
      `SELECT * FROM reminders
       WHERE user_id = ? AND is_active = 1 AND datetime(date_time) >= datetime('now')
       ORDER BY date_time`,
      [userId]
    );
    res.json({ ok: true, reminders: rows || [] });
  } catch (err) {
    next(err);
  }
});

// POST route - scheduler call is REMOVED
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

    // --- REMOVED ---
    // scheduler.scheduleReminder(newRow);

    res.json({ ok: true, reminder: newRow });
  } catch (err) {
    next(err);
  }
});

// PUT route - scheduler call is REMOVED
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
      "notification_id", // This field IS used now
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

    const result = await db.run(sql, params);
    if (!result.changes)
      return res.status(404).json({ ok: false, message: "Reminder not found" });

    const updated = await db.get("SELECT * FROM reminders WHERE id = ?", [id]);

    // --- REMOVED ---
    // scheduler.scheduleReminder(updated);

    res.json({ ok: true, reminder: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE route - scheduler call is REMOVED
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const result = await db.run(
      `UPDATE reminders SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`,
      [userId, id]
    );

    if (!result.changes)
      return res.status(404).json({ ok: false, message: "Reminder not found" });

    // --- REMOVED ---
    // scheduler.cancelReminder(id);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
