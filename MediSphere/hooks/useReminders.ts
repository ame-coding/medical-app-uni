// app/hooks/useReminders.ts
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import BASE_URL from "../lib/apiconfig";
import { authFetch } from "../lib/auth";
import { cancel } from "./notificationHelper"; // should work with alias exported

export type Reminder = {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  date_time: string;
  repeat_interval?: string | null;
  notification_id?: string | null;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
};

export default function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/reminders`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.reminders)) {
        setReminders(
          json.reminders.map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            title: r.title ?? "Untitled",
            description: r.description ?? "",
            date_time: r.date_time ?? new Date().toISOString(),
            repeat_interval: r.repeat_interval ?? null,
            notification_id: r.notification_id ?? null,
            is_active: r.is_active ?? 1,
            created_at: r.created_at ?? new Date().toISOString(),
            updated_at: r.updated_at ?? new Date().toISOString(),
          }))
        );
      } else {
        setReminders([]);
      }
    } catch (err) {
      console.warn("fetchReminders error:", err);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReminders();
      return () => {};
    }, [fetchReminders])
  );

  const cancelAndClear = async (
    id: number,
    onDone: (() => void) | null = null
  ) => {
    try {
      // 1. Find the reminder to get its local notification ID
      const reminderToCancel = reminders.find((r) => r.id === id);
      if (reminderToCancel && reminderToCancel.notification_id) {
        // 2. Cancel the local notification on the device
        await cancel(reminderToCancel.notification_id);
      }

      // 3. Delete the reminder from the server
      await authFetch(`${BASE_URL}/reminders/${id}`, { method: "DELETE" });

      // 4. Refresh the list
      await fetchReminders();
      if (onDone) onDone();
    } catch (err) {
      console.warn("cancelAndClear error:", err);
    }
  };

  return { reminders, loading, cancelAndClear, refresh: fetchReminders };
}
