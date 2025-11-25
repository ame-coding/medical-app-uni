// express-serv/routes/profile.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../dbfiles/db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/* Utilities */
function sendServerError(res, label, err) {
  console.error(label, err);
  return res.status(500).json({
    ok: false,
    message: "Server error",
    errorLabel: label,
    errorMessage: err?.message,
  });
}

/* Upload Setup */
const uploadRoot = path.join(process.cwd(), "userfiles", "uploads");
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(uploadRoot, String(req.user.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${name}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const fileKeyPath = (key) => (key ? path.join(uploadRoot, key) : null);

/* =====================================================
   GET /api/profile/:id
===================================================== */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db.get(
      "SELECT id, username, role, avatar FROM users WHERE id = ?",
      [id]
    );

    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    const userinfo = await db.get(
      "SELECT first_name, last_name, gender, phone, dob FROM userinfo WHERE user_id = ?",
      [id]
    );

    const host = `${req.protocol}://${req.get("host")}`;
    const avatar_url = user.avatar
      ? `${host}/api/uploads/${user.avatar}`
      : null;

    return res.json({
      ok: true,
      user: { ...user, avatar_url },
      userinfo: userinfo || {},
    });
  } catch (err) {
    return sendServerError(res, "GET profile failed", err);
  }
});

/* =====================================================
   PUT /api/profile/:id
===================================================== */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const incoming = req.body?.userinfo;

  if (!incoming)
    return res
      .status(400)
      .json({ ok: false, message: "Missing userinfo object" });

  try {
    const exists = await db.get("SELECT id FROM userinfo WHERE user_id=?", [
      id,
    ]);

    const fields = ["first_name", "last_name", "gender", "phone", "dob"];
    const provided = {};
    fields.forEach((f) => {
      if (incoming.hasOwnProperty(f)) provided[f] = incoming[f];
    });

    if (exists) {
      if (Object.keys(provided).length > 0) {
        const setStr = Object.keys(provided)
          .map((k) => `${k}=?`)
          .join(", ");
        const params = [...Object.values(provided), id];
        await db.run(`UPDATE userinfo SET ${setStr} WHERE user_id=?`, params);
      }
    } else {
      await db.run(
        `INSERT INTO userinfo(user_id, first_name, last_name, gender, phone, dob)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          incoming.first_name ?? null,
          incoming.last_name ?? null,
          incoming.gender ?? null,
          incoming.phone ?? null,
          incoming.dob ?? null,
        ]
      );
    }

    const updatedUser = await db.get(
      "SELECT id, username, role, avatar FROM users WHERE id = ?",
      [id]
    );
    const updatedUserinfo = await db.get(
      "SELECT first_name, last_name, gender, phone, dob FROM userinfo WHERE user_id = ?",
      [id]
    );
    const host = `${req.protocol}://${req.get("host")}`;
    const avatar_url = updatedUser.avatar
      ? `${host}/api/uploads/${updatedUser.avatar}`
      : null;

    return res.json({
      ok: true,
      message: "Userinfo updated",
      user: { ...updatedUser, avatar_url },
      userinfo: updatedUserinfo || {},
    });
  } catch (err) {
    return sendServerError(res, "PUT profile failed", err);
  }
});

/* =====================================================
   POST /api/profile/:id/avatar
===================================================== */
router.post("/:id/avatar", auth, upload.single("avatar"), async (req, res) => {
  const userId = Number(req.params.id);

  if (!userId)
    return res.status(400).json({ ok: false, message: "Invalid user ID" });

  if (req.user.id !== userId && req.user.role !== "admin")
    return res.status(403).json({ ok: false, message: "Forbidden" });

  try {
    const old = await db.get("SELECT avatar FROM users WHERE id=?", [userId]);

    if (old?.avatar) {
      const oldPath = fileKeyPath(old.avatar);
      if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const newKey = req.file ? `${req.user.id}/${req.file.filename}` : null;

    await db.run("UPDATE users SET avatar=? WHERE id=?", [newKey, userId]);

    const host = `${req.protocol}://${req.get("host")}`;
    const avatar_url = newKey ? `${host}/api/uploads/${newKey}` : null;

    return res.json({ ok: true, avatar_url });
  } catch (err) {
    return sendServerError(res, "Avatar upload failed", err);
  }
});

/* =====================================================
   DELETE /api/profile/:id/avatar
===================================================== */
router.delete("/:id/avatar", auth, async (req, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ ok: false, message: "Invalid user ID" });
  }

  if (req.user.id !== userId && req.user.role !== "admin") {
    return res.status(403).json({ ok: false, message: "Unauthorized" });
  }

  try {
    const old = await db.get("SELECT avatar FROM users WHERE id=?", [userId]);

    if (old?.avatar) {
      const oldPath = path.join(
        process.cwd(),
        "userfiles",
        "uploads",
        old.avatar
      );
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await db.run("UPDATE users SET avatar=NULL WHERE id=?", [userId]);

    return res.json({ ok: true, message: "Avatar removed", avatar_url: null });
  } catch (err) {
    console.error("DELETE avatar error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
