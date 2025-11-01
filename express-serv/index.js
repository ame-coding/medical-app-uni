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
import profileRouter from "./routes/profile.js";

import db from "./dbfiles/db.js";

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
// serve uploaded files statically
const uploadsDir = path.join(process.cwd(), "userfiles", "uploads");
app.use("/uploads", express.static(uploadsDir));

// mount routers
app.use("/api/register", registerroute);
app.use("/api/auth", loginRouter);
app.use("/api/records", recordsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/profile", profileRouter); // <--- ROUTE MOUNTED


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
      DELETE FROM reminders
      WHERE (repeat_interval IS NULL OR repeat_interval = 'none')
        AND datetime(date_time) < datetime('now')
    `
    );

    if (result.changes > 0) {
      console.log(`Deleted ${result.changes} expired reminders.`);
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

  // --- ADD THIS BLOCK ---
  // Run cleanup on server start
  await cleanupExpiredReminders();

  // And run it automatically every 10 minutes
  const TEN_MINUTES_MS = 10 * 60 * 1000;
  setInterval(cleanupExpiredReminders, TEN_MINUTES_MS);
  // --- END BLOCK ---
});
