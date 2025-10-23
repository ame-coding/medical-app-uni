// express-serv/index.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import loginRouter from "./routes/loginapi.js";
import recordsRouter from "./routes/records.js";
import registerroute from "./routes/registerapi.js";
import remindersRouter from "./routes/reminders.js";

import db from "./dbfiles/db.js";
// (No scheduler or pushToken needed)

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// mount routers
app.use("/api/register", registerroute);
app.use("/api/auth", loginRouter);
app.use("/api/records", recordsRouter);
app.use("/api/reminders", remindersRouter);

// health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// --- ADD THIS NEW FUNCTION ---
/**
 * This function finds all one-time (non-repeating) reminders
 * that are in the past and marks them as inactive (is_active = 0).
 */
async function cleanupExpiredReminders() {
  console.log("Running automatic cleanup of expired reminders...");
  try {
    const result = await db.run(
      `
      UPDATE reminders
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE is_active = 1
        AND (repeat_interval IS NULL OR repeat_interval = 'none')
        AND datetime(date_time) < datetime('now')
    `
    );

    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} expired reminders.`);
    }
  } catch (err) {
    console.error("Error during reminder cleanup:", err);
  }
}
// --- END NEW FUNCTION ---

// centralized error handler
app.use((err, _req, res, _next) => {
  console.error("Server error handler:", err);
  res
    .status(err?.status || 500)
    .json({ ok: false, message: err?.msg || "Server error" });
});

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // ensure DB
  if (db.init) await db.init();

  // --- ADD THIS BLOCK ---
  // Run cleanup on server start
  await cleanupExpiredReminders();

  // And run it automatically every 6 hours
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  setInterval(cleanupExpiredReminders, SIX_HOURS_MS);
  // --- END BLOCK ---
});
