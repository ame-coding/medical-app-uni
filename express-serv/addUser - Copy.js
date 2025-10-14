// addUser.js
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";

// --- User details to add ---
const newUsername = "admin2";
const newPassword = "password123"; // The plain-text password you want
const newRole = "admin";
// ---------------------------

const dbPath = path.resolve("./dbfiles/app.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error("Failed to open database:", err.message);
  }
  console.log("Connected to the SQLite database.");
});

// Hash the password
const salt = bcrypt.genSaltSync(10);
const passwordHash = bcrypt.hashSync(newPassword, salt);

const sql = `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`;

db.run(sql, [newUsername, passwordHash, newRole], function (err) {
  if (err) {
    // 'UNIQUE constraint failed' means the user already exists
    return console.error("Error adding user:", err.message);
  }
  console.log(
    `Successfully added user '${newUsername}' with ID: ${this.lastID}`
  );
});

db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Closed the database connection.");
});
