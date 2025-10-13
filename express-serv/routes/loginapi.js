import { Router } from "express";
import bcrypt from "bcryptjs";
import sqlite3 from "sqlite3";
import jwt from "jsonwebtoken";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../dbfiles/app.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Failed to open database:", err.message);
  else console.log("Connected to SQLite (loginapi)");
});

const JWT_SECRET = process.env.JWT_SECRET || "devjwtsecret";
const JWT_EXPIRES = "7d";

// Middleware: expect "Authorization: Bearer <token>"
function auth(req, _res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return next({ status: 401, msg: "Missing token" });
  try {
    req.user = jwt.verify(match[1], JWT_SECRET); // { sub, role }
    next();
  } catch {
    next({ status: 401, msg: "Invalid or expired token" });
  }
}

// POST /login -> returns JWT and user {username, role}
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "username and password are required" });
  }

  db.get(
    "SELECT username, role, password_hash FROM users WHERE username = ?",
    [username],
    (err, row) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!row) return res.status(401).json({ ok: false, message: "Invalid credentials" });

      const ok = bcrypt.compareSync(password, row.password_hash);
      if (!ok) return res.status(401).json({ ok: false, message: "Invalid credentials" });

      const token = jwt.sign({ sub: row.username, role: row.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
      res.json({ ok: true, token, user: { username: row.username, role: row.role } });
    }
  );
});

// GET /me -> protected (reads token)
router.get("/me", auth, (req, res) => {
  res.json({ ok: true, user: { username: req.user.sub, role: req.user.role } });
});

// POST /logout -> no-op with JWT (client discards token)
router.post("/logout", (_req, res) => res.json({ ok: true }));

// Minimal error handler
router.use((err, _req, res, _next) => {
  res.status(err?.status || 500).json({ ok: false, message: err?.msg || "Server error" });
});

export default router;
