import { Router } from "express";
import sqlite3 from "sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../dbfiles/app.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Failed to open database:", err.message);
  else console.log("Connected to SQLite (quoteapi)");
});

// GET /quote -> random quote
router.get("/quote", (_req, res) => {
  db.get("SELECT text FROM quotes ORDER BY RANDOM() LIMIT 1", [], (err, row) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    res.json({ ok: true, quote: row?.text || "" });
  });
});

export default router;
