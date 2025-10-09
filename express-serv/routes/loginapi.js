import { Router } from "express";
import bcrypt from "bcryptjs";
import { dbPromise } from "../db.js";

const router = Router();

/**
 * POST /login
 * Body: { username, password }
 * On success -> sets session cookie, returns { ok:true, username }
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "Missing credentials" });
  }

  const db = await dbPromise;
  const row = await db.get("SELECT * FROM users WHERE username = ?", [username]);
  if (!row) return res.status(401).json({ ok: false, message: "Invalid credentials" });

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return res.status(401).json({ ok: false, message: "Invalid credentials" });

  // Attach to session
  req.session.user = { id: row.id, username: row.username };
  res.json({ ok: true, username: row.username });
});

/**
 * GET /me
 * Returns current session user if logged in
 */
router.get("/me", (req, res) => {
  if (req.session?.user) {
    return res.json({ ok: true, user: req.session.user });
  }
  res.status(401).json({ ok: false });
});

/**
 * POST /logout
 * Destroys session
 */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

export default router;
