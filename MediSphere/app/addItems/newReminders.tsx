// app/addItems/newReminders.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import BASE_URL from "../../lib/apiconfig";
import { authFetch } from "../../lib/auth";
import {
  schedule,
  ensurePermissionsAndChannel,
} from "../../hooks/notificationHelper";

export default function NewReminders() {
  const { colors, styles, sizes } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, any>;
  const { prefill, date: dateParam } = params || {};

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">(
    "none"
  );
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState<boolean>(false);

  // If a date param is provided, set it (try decodeURIComponent)
  useEffect(() => {
    if (dateParam) {
      try {
        const decoded = decodeURIComponent(String(dateParam));
        const d = new Date(decoded);
        if (!Number.isNaN(d.getTime())) setDate(d);
      } catch (e) {
        console.warn("Failed to parse date param:", e);
      }
    }
  }, [dateParam]);

  // If prefill id provided, fetch record and prefill fields
  useEffect(() => {
    if (!prefill) return;
    (async () => {
      setPrefillLoading(true);
      try {
        const res = await authFetch(
          `${BASE_URL}/records/${encodeURIComponent(prefill)}`
        );
        if (!res.ok) {
          console.warn("Prefill record fetch failed", res.status);
          setPrefillLoading(false);
          return;
        }
        const json = await res.json();
        const record = json.record;
        if (record) {
          setTitle(record.record_title || "");
          setDesc(record.description || "");
          // if record.date exists and no explicit date param was given, use record.date
          if (record.date && !dateParam) {
            const d = new Date(record.date);
            if (!Number.isNaN(d.getTime())) setDate(d);
          }
        }
      } catch (err) {
        console.warn("Error fetching prefill record:", err);
      } finally {
        setPrefillLoading(false);
      }
    })();
  }, [prefill, dateParam]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDate(newDate);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Error", "Title is required");
    setLoading(true);

    try {
      const body = {
        title,
        description: desc,
        date_time: date.toISOString(),
        repeat_interval: repeat !== "none" ? repeat : null,
      };

      // 1. Create reminder on server
      const res = await authFetch(`${BASE_URL}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!json.ok) {
        Alert.alert("Error", json.message || "Failed to create reminder");
        setLoading(false);
        return;
      }

      const reminder = json.reminder;

      try {
        // 2. Get permissions (required for local notifications)
        await ensurePermissionsAndChannel();
      } catch (err: any) {
        console.warn("Notifications setup failed:", err?.message || err);
        // Don't block, just warn.
      }

      try {
        // 3. Schedule local notification on the device
        const localId = await schedule(reminder);

        // 4. Update the server with the new local notification ID
        await authFetch(`${BASE_URL}/reminders/${reminder.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_id: localId }),
        });
      } catch (err) {
        console.warn("Failed to schedule local notification:", err);
      }

      Alert.alert("Success", "Reminder saved");
      router.back();
    } catch (err) {
      console.warn("Create reminder error", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // show loading spinner while fetching prefill
  if (prefillLoading)
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: sizes.gap }}>
        <Text style={[styles.heading, { marginBottom: sizes.gap }]}>
          New Reminder
        </Text>

        <TextInput
          placeholder="Title"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          placeholder="Description"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
          value={desc}
          onChangeText={setDesc}
        />

        {/* Date & Time */}
        {Platform.OS === "web" ? (
          <input
            type="datetime-local"
            value={date.toISOString().slice(0, 16)}
            onChange={(e) => setDate(new Date(e.target.value))}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              backgroundColor: colors.surface,
            }}
          />
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.card, { padding: 12, marginVertical: 5 }]}
            >
              <Text>Date: {date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={[styles.card, { padding: 12, marginVertical: 5 }]}
            >
              <Text>Time: {date.toLocaleTimeString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display="default"
                onChange={onChangeTime}
              />
            )}
          </>
        )}

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginVertical: sizes.gap,
            gap: 8,
          }}
        >
          {["none", "daily", "weekly", "monthly"].map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setRepeat(opt as any)}
              style={[
                styles.button,
                {
                  flex: 1,
                  minWidth: "48%",
                  marginBottom: 8,
                  backgroundColor:
                    repeat === opt ? colors.secondary : colors.primary,
                },
              ]}
            >
              <Text style={styles.buttonText}>
                {opt === "none"
                  ? "One-time"
                  : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.button, { marginTop: 20 }]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Save Reminder"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
