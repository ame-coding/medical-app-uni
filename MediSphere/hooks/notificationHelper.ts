// app/hooks/notificationHelper.ts
import { Platform } from "react-native";

/**
 * IMPORTANT: this file tries to require 'expo-notifications' dynamically
 * so your app won't crash at import time if the package is missing.
 * But you must install expo-notifications for scheduling to work:
 * expo install expo-notifications
 */
let Notifications: any = null;
try {
  // use require so bundler won't fail if package missing during static analysis
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require("expo-notifications");
} catch (e) {
  Notifications = null;
  console.warn(
    "expo-notifications package not found. Run `expo install expo-notifications`"
  );
}

export function ensureNotificationsAvailableOrThrow() {
  if (!Notifications) {
    throw new Error(
      "Module 'expo-notifications' not found. Run `expo install expo-notifications` and restart the app."
    );
  }
}

export async function ensurePermissionsAndChannel() {
  ensureNotificationsAvailableOrThrow();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted")
    throw new Error("Notifications permission not granted");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }
}

export async function schedule(reminder: any) {
  ensureNotificationsAvailableOrThrow();
  const when = new Date(reminder.date_time);

  // Default trigger: one-time, at the specified date
  let trigger: any = when;

  if (reminder.repeat_interval === "daily") {
    trigger = {
      hour: when.getHours(),
      minute: when.getMinutes(),
      repeats: true,
    };
  } else if (reminder.repeat_interval === "weekly") {
    trigger = {
      weekday: when.getDay() + 1, // getDay() is 0 (Sun) - 6 (Sat), Expo trigger is 1 (Sun) - 7 (Sat)
      hour: when.getHours(),
      minute: when.getMinutes(),
      repeats: true,
    };
  } else if (reminder.repeat_interval === "monthly") {
    trigger = {
      day: when.getDate(), // getDate() is day of the month (1-31)
      hour: when.getHours(),
      minute: when.getMinutes(),
      repeats: true,
    };
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title || "Reminder",
      body: reminder.description || "",
      data: { reminderId: reminder.id },
    },
    trigger,
  });

  return id as string;
}

export async function cancel(localNotificationId: string | null) {
  if (!localNotificationId) return;
  ensureNotificationsAvailableOrThrow();
  try {
    await Notifications.cancelScheduledNotificationAsync(localNotificationId);
  } catch (err) {
    console.warn("Cancel local notification failed", err);
  }
}

