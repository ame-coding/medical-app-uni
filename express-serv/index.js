import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import loginApi from "./routes/loginapi.js";
import quoteApi from "./routes/quoteapi.js";

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser()); // UNSIGNED cookies (simple mode)

app.use(loginApi);
app.use(quoteApi);

const HOST = "0.0.0.0";
const PORT = 4000;
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://192.168.1.100:${PORT}`);
});
