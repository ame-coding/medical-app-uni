// express-serv/routes/pushToken.js
import express from "express";
import { auth } from "../middleware/auth.js";
import db from "../dbfiles/db.js";

const router = express.Router();

/**
 * PUT /api/me/token
 * body: { token: string }
 * Saves token to users.push_token. Adds column if missing.
 */
router.put("/token", auth, async (req, res) => {
  try {
    const token = req.body?.token;
    if (!token)
      return res.status(400).json({ ok: false, message: "token required" });

    // try update first
    try {
      await db.run("UPDATE users SET push_token = ? WHERE id = ?", [
        token,
        req.user.id,
      ]);
      return res.json({ ok: true });
    } catch (innerErr) {
      // if column missing, add it then update
      try {
        console.warn("push_token column missing, adding it:", innerErr.message);
        await db.run("ALTER TABLE users ADD COLUMN push_token TEXT");
        await db.run("UPDATE users SET push_token = ? WHERE id = ?", [
          token,
          req.user.id,
        ]);
        return res.json({ ok: true, addedColumn: true });
      } catch (addErr) {
        console.error("Failed to add push_token column:", addErr);
        return res.status(500).json({ ok: false, message: "DB error" });
      }
    }
  } catch (err) {
    console.error("PUT /me/token error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
