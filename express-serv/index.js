// express-serv/index.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "node:path";

import loginRouter from "./routes/loginapi.js";
import recordsRouter from "./routes/records.js";
import registerRouter from "./routes/registerapi.js";
import remindersRouter from "./routes/reminders.js";
import profileRouter from "./routes/profile.js";
import recommendationsRouter from "./routes/recommendations.js";

// NEW: chat router (ensure this file exports default router as ESM)
import chatRouter from "./routes/chat.js";

import db from "./dbfiles/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Static hosting for profile photos & uploads
const uploadsDir = path.join(process.cwd(), "userfiles", "uploads");
app.use("/api/uploads", express.static(uploadsDir));

// Health checks
app.get("/__health", (req, res) => {
  res.json({ ok: true, ip: req.ip, time: new Date().toISOString() });
});
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routers
app.use("/api/register", registerRouter);
app.use("/api/auth", loginRouter);
app.use("/api/records", recordsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/profile", profileRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/chat", chatRouter);

// Cleanup expired reminders
async function cleanupExpiredReminders() {
  console.log("Running expired reminder cleanup...");
  try {
    const result = await db.run(
      `
      DELETE FROM reminders
      WHERE (repeat_interval IS NULL OR repeat_interval='none')
      AND datetime(date_time) < datetime('now')
    `
    );
    console.log(`Deleted ${result.changes} expired reminders.`);
  } catch (err) {
    console.error("Reminder cleanup error:", err);
  }
}

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Global error:", err);
  res
    .status(err?.status || 500)
    .json({ ok: false, message: err?.msg || "Server error" });
});

// Start server
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running at http://localhost:${PORT}`);

  // ensure chat DB tables before running periodic jobs
  await ensureChatTables();

  await cleanupExpiredReminders();
  setInterval(cleanupExpiredReminders, 10 * 60 * 1000);
});
