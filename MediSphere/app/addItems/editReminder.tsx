// app/addItems/editReminder.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../hooks/useTheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import BASE_URL from "../../lib/apiconfig";
import { authFetch } from "../../lib/auth";

type Params = { id?: string };

export default function EditReminder() {
  const { styles, colors, sizes } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams() as Params;
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">(
    "none"
  );
  const [isActive, setIsActive] = useState(1);

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Missing reminder id");
      router.back();
      return;
    }
    fetchReminder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchReminder = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/reminders/${id}`);
      const raw = await res.text();
      let json = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch (e) {
        json = null;
      }

      if (!res.ok) {
        Alert.alert("Error", json?.message || "Failed to load reminder");
        router.back();
        return;
      }

      const r = json.reminder;
      setTitle(r.title ?? "");
      setDescription(r.description ?? "");
      setDate(r.date_time ? new Date(r.date_time) : new Date());
      setRepeat(r.repeat_interval ?? "none");
      setIsActive(r.is_active ?? 1);
    } catch (err) {
      console.error("fetchReminder error:", err);
      Alert.alert("Error", "Network error");
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert("Error", "Title is required");
    setSaving(true);
    try {
      const body: any = {
        title: title.trim(),
        description: description || null,
        date_time: date.toISOString(),
        repeat_interval: repeat !== "none" ? repeat : null,
        is_active: isActive ? 1 : 0,
      };

      const res = await authFetch(`${BASE_URL}/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        Alert.alert("Error", json?.message || "Failed to update reminder");
        return;
      }

      Alert.alert("Success", "Reminder updated");
      router.back();
    } catch (err) {
      console.error("save reminder error:", err);
      Alert.alert("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: sizes.gap }}>
      <Text style={[styles.heading, { marginBottom: sizes.gap }]}>
        Edit Reminder
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
        value={description}
        onChangeText={setDescription}
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
          gap: 8,
          marginVertical: sizes.gap,
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

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 8,
        }}
      >
        <Text style={{ marginRight: 12 }}>Active</Text>
        <TouchableOpacity
          onPress={() => setIsActive(isActive ? 0 : 1)}
          style={{
            padding: 10,
            backgroundColor: isActive ? colors.secondary : colors.surface,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: colors.text }}>{isActive ? "Yes" : "No"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={[styles.button, { marginTop: 16 }]}
      >
        <Text style={styles.buttonText}>
          {saving ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({});
