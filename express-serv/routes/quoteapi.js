import { Router } from "express";

const router = Router();

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Believe you can and you're halfway there.",
  "Success is not in what you have, but who you are."
];

router.get("/quote", (req, res) => {
  const random = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  res.json({ quote: random });
});

export default router;
