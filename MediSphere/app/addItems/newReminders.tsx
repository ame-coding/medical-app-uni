import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
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

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">(
    "none"
  );
  const [loading, setLoading] = useState(false);

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
        await ensurePermissionsAndChannel();
      } catch (err) {
        console.warn("Notifications setup failed:", err);
      }

      try {
        const localId = await schedule(reminder);
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
            flexWrap: "wrap", // allow wrapping
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
                  minWidth: "48%", // 2 buttons per row
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
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Save Reminder"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
