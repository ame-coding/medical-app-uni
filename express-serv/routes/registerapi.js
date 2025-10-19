// express-serv/routes/register.js
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
  if (err) console.error("Failed to open DB:", err.message);
  else console.log("Connected to SQLite (register)");
});

// POST /api/register -> create new user + userinfo
router.post("/register", (req, res) => {
  const {
    username,
    password,
    first_name,
    last_name,
    gender,
    phone,
    age,
  } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "username and password are required" });
  }

  // check if username already exists
  db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (row)
      return res.status(400).json({ ok: false, message: "Username already taken" });

    const password_hash = bcrypt.hashSync(password, 10);

    // insert into users
    const insertUserSql =
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)";
    db.run(insertUserSql, [username, password_hash, "user"], function (userErr) {
      if (userErr)
        return res.status(500).json({ ok: false, message: "User insert failed" });

      const userId = this.lastID;

      // insert into userinfo (dependent table)
      const insertInfoSql = `
        INSERT INTO userinfo (user_id, first_name, last_name, gender, phone, age)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.run(
        insertInfoSql,
        [userId, first_name || "", last_name || "", gender || "", phone || "", age || null],
        (infoErr) => {
          if (infoErr)
            return res.status(500).json({ ok: false, message: "Userinfo insert failed" });

          res.status(201).json({
            ok: true,
            message: "User registered successfully",
            user: { id: userId, username, role: "user" },
          });
        }
      );
    });
  });
});

export default router;
