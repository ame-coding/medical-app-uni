// express-serv/index.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import loginRouter from "./routes/loginapi.js";
import recordsRouter from "./routes/records.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json()); // important so req.body works

// simple logger for dev
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// mount routers
app.use("/api/auth", loginRouter); // login/register related
app.use("/api/records", recordsRouter); // records endpoints

// health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// centralized error handler
app.use((err, _req, res, _next) => {
  console.error("Server error handler:", err);
  res
    .status(err?.status || 500)
    .json({ ok: false, message: err?.msg || "Server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
