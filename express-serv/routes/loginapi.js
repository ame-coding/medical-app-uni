import { Router } from "express";
import bcrypt from "bcryptjs";
import sqlite3 from "sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../dbfiles/app.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Failed to open database:", err.message);
  else console.log("Connected to SQLite database (loginapi)");
});

// POST /login -> bcrypt check against app.db, sets cookie with {username, role}
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "username and password are required" });
  }
  db.get("SELECT username, role, password_hash FROM users WHERE username = ?", [username], (err, row) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (!row) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const valid = bcrypt.compareSync(password, row.password_hash);
    if (!valid) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    res.cookie("user", JSON.stringify({ username: row.username, role: row.role }), {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });
    res.json({ ok: true, user: { username: row.username, role: row.role } });
  });
});

// GET /me -> returns cookie identity
router.get("/me", (req, res) => {
  try {
    const raw = req.cookies?.user;
    if (!raw) return res.status(401).json({ ok: false });
    const user = JSON.parse(raw);
    if (!user?.username) return res.status(401).json({ ok: false });
    res.json({ ok: true, user });
  } catch {
    res.status(401).json({ ok: false });
  }
});

// POST /logout -> clear cookie
router.post("/logout", (_req, res) => {
  res.clearCookie("user");
  res.json({ ok: true });
});

export default router;
