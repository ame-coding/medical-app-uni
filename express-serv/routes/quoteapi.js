import { Router } from "express";
import db from "../dbfiles/db.js"; // <-- IMPORT SHARED DB

const router = Router();

// GET /quote -> random quote
router.get("/quote", async (_req, res) => {
  // <-- Added async
  try {
    const row = await db.get(
      "SELECT text FROM quotes ORDER BY RANDOM() LIMIT 1",
      []
    ); // <-- Changed to await
    res.json({ ok: true, quote: row?.text || "" });
  } catch (err) {
    console.error("Quote DB error:", err.message);
    return res.status(500).json({ ok: false, message: "DB error" });
  }
});

export default router;
