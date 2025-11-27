// MediSphere/hooks/notificationHelper.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Native-scheduled notification helper.
 *
 * - Schedules notifications via expo-notifications native trigger (works when app is closed).
 * - Persists reminder metadata to AsyncStorage so UI can list scheduled items.
 * - Stores the native scheduled id (returned by scheduleNotificationAsync) as the local id.
 *
 * Public API kept compatible with your existing code.
 */

const STORAGE_KEY = "local_notifications_v1";
const ANDROID_CHANNEL_ID = "mymeds-default";

/** ReminderItem returned to callers */
export type ReminderItem = {
  id: string; // native scheduled ID (string returned by expo-notifications)
  date_time: string; // ISO string
  title: string;
  body?: string;
  reminderId?: number | null; // optional server reminder id
  data?: Record<string, any> | null; // optional payload (route etc)
};

/* Notification handler so foreground shows banners */
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => {
    return {
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

/* ---------------------- Persistence helpers ---------------------- */
async function persist(map: Record<string, ReminderItem>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("notificationHelper.persist error", e);
  }
}

async function loadPersistedRaw(): Promise<Record<string, any>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (e) {
    console.warn("notificationHelper.loadPersisted error", e);
    return {};
  }
}

/* normalize raw -> ReminderItem */
function normalizeRawToReminder(id: string, raw: any): ReminderItem {
  return {
    id: String(raw?.id ?? id ?? String(Date.now())),
    date_time: String(raw?.date_time ?? raw?.date ?? new Date().toISOString()),
    title: String(raw?.title ?? raw?.name ?? ""),
    body: raw?.body ?? raw?.description ?? "",
    reminderId:
      raw?.reminderId != null
        ? Number.isFinite(Number(raw.reminderId))
          ? Number(raw.reminderId)
          : null
        : null,
    data: raw?.data ?? null,
  };
}

/* ---------------------- Channel & permissions ---------------------- */
export async function ensurePermissionsAndChannel(): Promise<void> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("Notifications permission not granted");
      // we continue — native scheduling might still work but system may block alerts
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
        enableLights: true,
        lightColor: "#FF0000",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  } catch (e) {
    console.warn("ensurePermissionsAndChannel error", e);
  }
}

/* ---------------------- Native scheduling API ---------------------- */
/**
 * Schedules a native notification for `isoDate`.
 * Returns the native scheduled notification id (string).
 * Stores metadata in AsyncStorage so UI can list it.
 */
export async function scheduleLocalNotification(
  isoDate: string,
  title: string,
  body?: string,
  reminderId?: number | null,
  data?: Record<string, any> | null
): Promise<string> {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) {
    throw new Error("Invalid date for scheduleLocalNotification");
  }

  // Build content and include our meta under __local_meta so listener can find it
  const content: Notifications.NotificationContentInput = {
    title: title ?? "Reminder",
    body: body ?? "",
    sound: "default",
    data: {
      __local_meta: {
        date_time: dt.toISOString(),
        title,
        body,
        reminderId,
        data,
      },
      ...(data ?? {}),
    },
  };

  // trigger: Date - works in native scheduling
  const trigger: Notifications.DateTriggerInput = {
    date: dt,
    type: Notifications.SchedulableTriggerInputTypes.DATE,
  };

  try {
    const nativeId = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });

    // persist metadata (nativeId as key)
    const persistedRaw = await loadPersistedRaw();
    const item: ReminderItem = {
      id: nativeId,
      date_time: dt.toISOString(),
      title: title ?? "",
      body: body ?? "",
      reminderId: reminderId ?? null,
      data: data ?? null,
    };
    persistedRaw[nativeId] = item;
    await persist(persistedRaw);

    return nativeId;
  } catch (e) {
    console.warn("scheduleLocalNotification error", e);
    throw e;
  }
}

/** Cancel a scheduled native notification by id (native scheduled id) */
export async function cancelLocalNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    console.warn("cancelLocalNotification native API error", e);
  }

  // remove from persisted map as well
  try {
    const persistedRaw = await loadPersistedRaw();
    if (persistedRaw[id]) {
      delete persistedRaw[id];
      await persist(persistedRaw);
    }
  } catch (e) {
    console.warn("cancelLocalNotification persist cleanup error", e);
  }
}

/* alias for existing imports */
export const cancel = cancelLocalNotification;

/* ---------------------- Sync / init ---------------------- */
/**
 * initNotificationScheduler
 * - Ensures permissions & channel
 * - Syncs persisted AsyncStorage map with native scheduled notifications
 *   (removes any persisted entries that no longer exist).
 */
export async function initNotificationScheduler(): Promise<void> {
  try {
    await ensurePermissionsAndChannel();

    const persistedRaw = await loadPersistedRaw();
    // fetch native scheduled notifications (may include items scheduled elsewhere)
    const nativeScheduled =
      await Notifications.getAllScheduledNotificationsAsync();

    // build a quick lookup of native scheduled ids
    const nativeIds = new Set(nativeScheduled.map((n) => n.identifier));

    // keep only persisted entries that are still scheduled natively
    const newPersist: Record<string, any> = {};
    for (const [k, v] of Object.entries(persistedRaw)) {
      const normalized = normalizeRawToReminder(k, v);
      if (nativeIds.has(normalized.id)) {
        newPersist[normalized.id] = normalized;
      } else {
        // If native id missing, we may trigger overdue locally OR drop — we'll drop to avoid dangling entries
        // Optionally: if date_time passed, you can fire a UI event here.
      }
    }

    await persist(newPersist);
  } catch (e) {
    console.warn("initNotificationScheduler error", e);
  }
}

/* ---------------------- Query helpers ---------------------- */
export async function getScheduledNotifications(): Promise<ReminderItem[]> {
  try {
    const persistedRaw = await loadPersistedRaw();
    const arr: ReminderItem[] = Object.entries(persistedRaw).map(([k, v]) =>
      normalizeRawToReminder(k, v)
    );
    return arr;
  } catch (e) {
    console.warn("getScheduledNotifications error", e);
    return [];
  }
}

/* ---------------------- Convenience / adapter for your server objects ---------------------- */
export async function schedule(
  reminder: any,
  data?: Record<string, any> | null
): Promise<string> {
  if (!reminder) throw new Error("Missing reminder to schedule");
  const iso = reminder.date_time ?? reminder.date ?? new Date().toISOString();
  const title = reminder.title ?? reminder.record_title ?? "Reminder";
  const body = reminder.description ?? reminder.body ?? "";
  const reminderId =
    reminder.id != null && !Number.isNaN(Number(reminder.id))
      ? Number(reminder.id)
      : null;
  return scheduleLocalNotification(iso, title, body, reminderId, data ?? null);
}

/* default export for compatibility */
export default {
  scheduleLocalNotification,
  cancelLocalNotification,
  cancel,
  initNotificationScheduler,
  getScheduledNotifications,
  schedule,
  ensurePermissionsAndChannel,
};
