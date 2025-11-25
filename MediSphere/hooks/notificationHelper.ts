// hooks/notificationHelper.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Local in-app notification helper.
 *
 * This file implements a lightweight scheduler using setTimeout while the app runs.
 * Scheduled reminders are persisted to AsyncStorage so they can be re-hydrated on app start.
 *
 * NOTE: setTimeout only fires while the JS runtime is alive. This helper re-schedules timers
 * when the app starts and uses persisted data to attempt delivery. If the device is fully
 * offline / app is killed and time passes, timers won't fire until the app starts again.
 *
 * Usage:
 *  - scheduleLocalNotification(isoDate, title, body) -> returns localNotificationId (string)
 *  - cancelLocalNotification(localNotificationId)
 *  - initNotificationScheduler() -> call once on app start to rehydrate timers
 */

const STORAGE_KEY = "local_notifications_v1";
const timers: Record<string, NodeJS.Timeout | number> = {}; // store timer ids
// store meta for active scheduled notifications in memory (also persisted)
let scheduledMap: Record<
  string,
  {
    id: string;
    date_time: string;
    title: string;
    body?: string;
    reminderId?: number | null; // optional server reminder id for linkage
  }
> = {};

/** Helper: persist scheduledMap to AsyncStorage */
async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scheduledMap));
  } catch (e) {
    console.warn("notificationHelper.persist error", e);
  }
}

/** Helper: load persisted scheduledMap */
async function loadPersisted() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn("notificationHelper.loadPersisted error", e);
    return {};
  }
}

/** Internal: trigger the notification callback (you will connect UI handler) */
function triggerLocalNotification(meta: {
  id: string;
  title: string;
  body?: string;
  reminderId?: number | null;
}) {
  // Default behavior: create a simple in-app notification event.
  // You should hook this into your app UI (e.g., show a toast, open modal or add a message to chat).
  // For convenience we emit a CustomEvent so UI can subscribe if needed.
  try {
    const ev = {
      type: "LOCAL_NOTIFICATION_RECEIVED",
      payload: meta,
    } as any;
    // dispatch on window if exists (web), or use global listener pattern
    if (typeof window !== "undefined" && (window as any).dispatchEvent) {
      const evt = new CustomEvent("LOCAL_NOTIFICATION_RECEIVED", {
        detail: ev,
      });
      (window as any).dispatchEvent(evt);
    }

    // if running in React Native without window, console log — UI should poll AsyncStorage or subscribe via other means
    console.log("Local notification triggered:", meta);
  } catch (e) {
    console.log("triggerLocalNotification", e);
  }
}

/** scheduleLocalNotification
 *  - isoDate: ISO string or any string parsable by Date()
 *  - returns local id string
 */
export async function scheduleLocalNotification(
  isoDate: string,
  title: string,
  body?: string,
  reminderId?: number | null
) {
  const id = `${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) {
    throw new Error("Invalid date for scheduleLocalNotification");
  }

  const now = new Date();
  const ms = dt.getTime() - now.getTime();
  // if time is already passed, trigger immediately (but still persist)
  const delay = Math.max(0, ms);

  // store in in-memory map and persist
  const meta = {
    id,
    date_time: dt.toISOString(),
    title,
    body: body || "",
    reminderId: reminderId || null,
  };
  scheduledMap[id] = meta;
  await persist();

  // schedule timer
  const timer = setTimeout(() => {
    // call trigger
    triggerLocalNotification(meta);
    // once fired, clean up unless repeating (no repeat support in this simple helper)
    delete scheduledMap[id];
    persist().catch(() => {});
    // clear timer reference
    try {
      delete timers[id];
    } catch {}
  }, delay);

  // store Node/Browser timer id
  timers[id] = timer as unknown as number;
  return id;
}

/** cancelLocalNotification */
export async function cancelLocalNotification(id: string) {
  try {
    const t = timers[id];
    if (t) {
      // Node / RN timer
      clearTimeout(t as any);
      delete timers[id];
    }
    if (scheduledMap[id]) {
      delete scheduledMap[id];
      await persist();
    }
  } catch (e) {
    console.warn("cancelLocalNotification", e);
  }
}

/** initNotificationScheduler
 *  - Rehydrates persisted notifications and re-schedules timers.
 *  - Call once at app start (e.g., in root App component or Home screen useEffect).
 */
export async function initNotificationScheduler() {
  try {
    const persisted = await loadPersisted();
    scheduledMap = persisted || {};
    const now = Date.now();

    Object.values(scheduledMap).forEach((meta) => {
      const dt = new Date(meta.date_time).getTime();
      const ms = Math.max(0, dt - now);
      // if it's already passed, trigger immediately and remove
      if (ms <= 0) {
        triggerLocalNotification(meta);
        delete scheduledMap[meta.id];
      } else {
        // schedule
        const timer = setTimeout(() => {
          triggerLocalNotification(meta);
          delete scheduledMap[meta.id];
          persist().catch(() => {});
        }, ms);
        timers[meta.id] = timer as unknown as number;
      }
    });
    // persist any changes (e.g., removed fired items)
    await persist();
  } catch (e) {
    console.warn("initNotificationScheduler error", e);
  }
}

/** getScheduledNotifications - returns array of persisted scheduled notifications */
export async function getScheduledNotifications() {
  try {
    const persisted = await loadPersisted();
    return Object.values(persisted || {});
  } catch (e) {
    return [];
  }
}
