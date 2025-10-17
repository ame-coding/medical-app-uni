// express-serv/middleware/auth.js
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "devjwtsecret";

export function auth(req, _res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return next({ status: 401, msg: "Missing token" });

  try {
    req.user = jwt.verify(match[1], JWT_SECRET); // { id, sub, role }
    next();
  } catch {
    next({ status: 401, msg: "Invalid or expired token" });
  }
}
