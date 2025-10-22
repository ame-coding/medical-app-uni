// express-serv/routes/register.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../dbfiles/db.js"; // <-- IMPORT SHARED DB

const router = Router();

// POST /api/register -> create new user + userinfo
router.post("/register", async (req, res) => {
  // <-- Added async
  const { username, password, first_name, last_name, gender, phone, dob } =
    req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "username and password are required" });
  }

  // Use a transaction for multi-step insert
  try {
    // 1. check if username already exists
    const row = await db.get("SELECT id FROM users WHERE username = ?", [
      // <-- Changed to await
      username,
    ]);
    if (row) {
      return res
        .status(400)
        .json({ ok: false, message: "Username already taken" });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    // 2. insert into users
    const insertUserSql =
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)";
    const userResult = await db.run(insertUserSql, [
      // <-- Changed to await
      username,
      password_hash,
      "user",
    ]);

    const userId = userResult.lastID;
    if (!userId) {
      throw new Error("Failed to create user, no lastID returned.");
    }

    // 3. insert into userinfo (dependent table)
    const insertInfoSql = `
      INSERT INTO userinfo (user_id, first_name, last_name, gender, phone, dob)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.run(insertInfoSql, [
      // <-- Changed to await
      userId,
      first_name || "",
      last_name || "",
      gender || "",
      phone || "",
      dob || null,
    ]);

    // 4. All good, send response
    res.status(201).json({
      ok: true,
      message: "User registered successfully",
      user: { id: userId, username, role: "user" },
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    return res
      .status(500)
      .json({ ok: false, message: "User registration failed" });
  }
});

export default router;
