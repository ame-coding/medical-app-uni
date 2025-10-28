// express-serv/routes/profile.js
import express from "express";
import db from "../dbfiles/db.js";
const router = express.Router();

function sendServerError(res, label, err) {
  console.error(label, err);
  return res.status(500).json({
    ok: false,
    message: "Server error",
    errorLabel: label,
    errorMessage: err && err.message,
    errorStack: err && err.stack,
  });
}

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(
    "GET /api/profile/:id called. originalUrl=",
    req.originalUrl,
    "id=",
    id
  );

  try {
    // Note: we intentionally do NOT select push_token here
    let user;
    try {
      user = await db.get("SELECT id, username, role FROM users WHERE id = ?", [
        id,
      ]);
      console.log("GET profile - users row ->", user);
    } catch (err) {
      return sendServerError(res, "DB: selecting user failed", err);
    }

    if (!user) {
      console.warn("GET profile: user not found id=", id);
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    let userinfo;
    try {
      userinfo = await db.get(
        "SELECT id, user_id, first_name, last_name, gender, phone, dob, created_at FROM userinfo WHERE user_id = ?",
        [id]
      );
      console.log("GET profile - userinfo row ->", userinfo);
    } catch (err) {
      return sendServerError(res, "DB: selecting userinfo failed", err);
    }

    return res.json({ ok: true, user, userinfo: userinfo || null });
  } catch (err) {
    return sendServerError(
      res,
      "Unexpected error in GET /api/profile/:id",
      err
    );
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(
    "PUT /api/profile/:id called. originalUrl=",
    req.originalUrl,
    "id=",
    id,
    "body=",
    req.body
  );

  try {
    const userExists = await db.get("SELECT id FROM users WHERE id = ?", [id]);
    if (!userExists) {
      console.warn("PUT profile: user not found id=", id);
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const incoming = req.body && req.body.userinfo;
    if (!incoming || typeof incoming !== "object") {
      console.warn("PUT profile: missing userinfo object");
      return res
        .status(400)
        .json({ ok: false, message: "Missing userinfo object in body" });
    }

    const allowed = ["first_name", "last_name", "gender", "phone", "dob"];
    const provided = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(incoming, k))
        provided[k] = incoming[k];
    }
    console.log("PUT profile: provided keys ->", provided);

    const existing = await db.get("SELECT id FROM userinfo WHERE user_id = ?", [
      id,
    ]);

    if (existing) {
      const fields = [];
      const params = [];
      for (const [k, v] of Object.entries(provided)) {
        fields.push(`${k} = ?`);
        params.push(v);
      }
      if (fields.length > 0) {
        params.push(id);
        const sql = `UPDATE userinfo SET ${fields.join(
          ", "
        )} WHERE user_id = ?`;
        console.log("PUT profile: running SQL ->", sql, "params ->", params);
        await db.run(sql, params);
      } else {
        console.log("PUT profile: nothing to update");
      }
    } else {
      const sql = `
        INSERT INTO userinfo
          (user_id, first_name, last_name, gender, phone, dob)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const params = [
        id,
        provided.first_name ?? null,
        provided.last_name ?? null,
        provided.gender ?? null,
        provided.phone ?? null,
        provided.dob ?? null,
      ];
      console.log("PUT profile: INSERT params ->", params);
      await db.run(sql, params);
    }

    // Return updated rows (no push_token)
    const updatedUser = await db.get(
      "SELECT id, username, role FROM users WHERE id = ?",
      [id]
    );
    const updatedUserinfo = await db.get(
      "SELECT id, user_id, first_name, last_name, gender, phone, dob, created_at FROM userinfo WHERE user_id = ?",
      [id]
    );

    console.log("PUT profile: returning updated rows", {
      updatedUser,
      updatedUserinfo,
    });

    return res.json({
      ok: true,
      message: "Userinfo updated",
      user: updatedUser,
      userinfo: updatedUserinfo || null,
    });
  } catch (err) {
    return sendServerError(
      res,
      "Unexpected error in PUT /api/profile/:id",
      err
    );
  }
});

export default router;
