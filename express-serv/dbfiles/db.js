// express-serv/db.js
import sqlite3 from "sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "./app.db");

sqlite3.verbose();
const rawDb = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Failed to open DB:", err.message);
  else console.log("Opened SQLite DB at", dbPath);
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// initialize reminders table if not exists
async function init() {
  const createReminders = `
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date_time TEXT NOT NULL,
      repeat_interval TEXT,
      notification_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_sent_at DATETIME
    );
  `;
  await run(createReminders);
  console.log("Ensured reminders table exists");
}

export default {
  raw: rawDb,
  run,
  get,
  all,
  init,
};
