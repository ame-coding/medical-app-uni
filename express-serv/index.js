import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import { initDb, dbPromise } from "./db.js";
import loginApi from "./routes/loginapi.js";
import quoteApi from "./routes/quoteapi.js";
import bcrypt from "bcryptjs";

const SQLiteStore = SQLiteStoreFactory(session);

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// For React Native apps, CORS preflights aren't strictly enforced,
// but enabling CORS is harmless and useful for web testing.
app.use(
  cors({
    origin: true, // reflect request origin (use array if you also serve a web client)
    credentials: true
  })
);

// Session cookie (sid)
app.use(
  session({
    name: "sid",
    secret: "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",   // works on http
      // secure: true,    // enable if using HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    },
    store: new SQLiteStore({ db: "sessions.db", dir: "./" })
  })
);

// Routes
app.use(loginApi);
app.use(quoteApi);

// Boot
const PORT = 4000;
const HOST = "0.0.0.0";

(async () => {
  await initDb();

  // Seed one demo user if missing
  const db = await dbPromise;
  const exists = await db.get("SELECT id FROM users WHERE username = ?", ["admin"]);
  if (!exists) {
    const hash = await bcrypt.hash("1234", 10);
    await db.run("INSERT INTO users (username, password_hash) VALUES (?,?)", [
      "admin",
      hash
    ]);
    console.log("Seeded user → admin / 1234");
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://192.168.1.100:${PORT}`);
  });
})();
