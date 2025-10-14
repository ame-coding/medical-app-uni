import 'dotenv/config';
import express from "express";
import cors from "cors";
import loginApi from "./routes/loginapi.js";
import quoteApi from "./routes/quoteapi.js";

const app = express();

app.use(express.json());
// JWT goes in Authorization header, so no cookie credentials required:
app.use(cors({ origin: true }));

app.use(loginApi);
app.use(quoteApi);

const PORT = 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://192.168.1.100:${PORT}`);
});
