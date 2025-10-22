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
import scheduler from "./notifications/scheduler.js";
import pushTokenRouter from "./routes/pushToken.js";

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
app.use("/api/me", pushTokenRouter);

// health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// centralized error handler
app.use((err, _req, res, _next) => {
  console.error("Server error handler:", err);
  res
    .status(err?.status || 500)
    .json({ ok: false, message: err?.msg || "Server error" });
});

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // ensure DB & schedule reminders
  if (db.init) await db.init();
  await scheduler.init(db);
});
