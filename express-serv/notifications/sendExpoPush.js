// express-serv/server/sendExpoPush.js
// Uses Expo Push service. Node 18+ has global fetch; otherwise install node-fetch.
export async function sendExpoPush(expoPushToken, title, body, data = {}) {
  if (!expoPushToken) return { ok: false, error: "no-token" };

  const message = {
    to: expoPushToken,
    sound: "default",
    title: title || "Notification",
    body: body || "",
    data,
  };

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("Expo push send failed:", json);
      return { ok: false, error: json };
    }

    return { ok: true, resp: json };
  } catch (err) {
    console.error("sendExpoPush error:", err);
    return { ok: false, error: err };
  }
}
export default sendExpoPush;
