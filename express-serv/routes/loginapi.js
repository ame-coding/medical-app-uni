// express-serv/routes/loginapi.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../dbfiles/db.js"; // <-- IMPORT SHARED DB
import { auth, JWT_SECRET } from "../middleware/auth.js"; // middleware and secret

const router = Router();

// POST /login -> returns JWT and user info
router.post("/login", async (req, res) => {
  // <-- Added async
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "username and password are required" });
  }

  try {
    const row = await db.get(
      // <-- Changed to await
      "SELECT id, username, role, password_hash FROM users WHERE username = ?",
      [username]
    );

    if (!row) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

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
  } catch (err) {
    console.error("Login DB error:", err.message);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// GET /me -> protected (No DB access, no change needed)
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

// POST /logout -> client discards token (No DB access, no change needed)
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
