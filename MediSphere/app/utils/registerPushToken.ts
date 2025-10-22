// app/utils/registerPushToken.ts
import * as Notifications from "expo-notifications";
import { authFetch } from "../../lib/auth";
import BASE_URL from "../../lib/apiconfig";

export async function registerExpoPushToken() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("Push permission not granted");
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const expoToken = tokenResponse?.data;
    if (!expoToken) {
      console.warn("No expo token returned");
      return null;
    }

    // Upload to server (authFetch attaches JWT)
    const res = await authFetch(`${BASE_URL}/me/token`, {
      method: "PUT",
      body: JSON.stringify({ token: expoToken }),
    });

    if (res.status === 401) {
      console.warn(
        "Token upload returned 401. Make sure user JWT is stored and authFetch returns it."
      );
      return expoToken;
    }

    const json = await res.json();
    if (!json.ok)
      console.warn("Server responded with error when saving push token:", json);

    return expoToken;
  } catch (err) {
    console.warn("registerExpoPushToken error:", err);
    return null;
  }
}
