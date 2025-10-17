// express-serv/routes/loginapi.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import sqlite3 from "sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import { auth, JWT_SECRET } from "../middleware/auth.js"; // middleware and secret

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../dbfiles/app.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Failed to open database:", err.message);
  else console.log("Connected to SQLite (loginapi)");
});

// POST /login -> returns JWT and user info
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "username and password are required" });
  }

  db.get(
    "SELECT id, username, role, password_hash FROM users WHERE username = ?",
    [username],
    (err, row) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!row)
        return res
          .status(401)
          .json({ ok: false, message: "Invalid credentials" });

      const ok = bcrypt.compareSync(password, row.password_hash);
      if (!ok)
        return res
          .status(401)
          .json({ ok: false, message: "Invalid credentials" });

      const token = jwt.sign(
        { id: row.id, sub: row.username, role: row.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        ok: true,
        token,
        user: { id: row.id, username: row.username, role: row.role },
      });
    }
  );
});

// GET /me -> protected
router.get("/me", auth, (req, res) => {
  // req.user is set by auth middleware
  res.json({
    ok: true,
    user: {
      id: req.user.id,
      username: req.user.sub,
      role: req.user.role,
    },
  });
});

// POST /logout -> client discards token
router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

// Minimal error handler
router.use((err, _req, res, _next) => {
  res
    .status(err?.status || 500)
    .json({ ok: false, message: err?.msg || "Server error" });
});

export default router;
