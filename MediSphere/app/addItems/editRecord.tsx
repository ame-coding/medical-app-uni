// app/editItems/editRecord.tsx
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

export default function EditRecord() {
  const { styles, colors, sizes } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams() as Params;
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [recordTitle, setRecordTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Missing record id");
      router.back();
      return;
    }
    fetchRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRecord = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/records/${id}`);
      const raw = await res.text();
      let json = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        Alert.alert("Error", json?.message || "Failed to load record");
        router.back();
        return;
      }

      const r = json.record;
      setRecordTitle(r.record_title ?? "");
      setDescription(r.description ?? "");
      // parse date (assume stored YYYY-MM-DD)
      setDate(r.date ? new Date(r.date + "T00:00:00") : new Date());
      setDoctorName(r.doctor_name ?? "");
      setHospitalName(r.hospital_name ?? "");
      setFileUrl(r.file_url ?? "");
    } catch (err) {
      console.error("fetchRecord error:", err);
      Alert.alert("Error", "Network error");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = async () => {
    if (!recordTitle.trim()) return Alert.alert("Error", "Title is required");
    setSaving(true);
    try {
      const payload: any = {
        record_title: recordTitle.trim(),
        description: description || null,
        // store only YYYY-MM-DD to match your schema
        date: date.toISOString().slice(0, 10),
        doctor_name: doctorName || null,
        hospital_name: hospitalName || null,
        file_url: fileUrl || null,
      };

      const res = await authFetch(`${BASE_URL}/records/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        Alert.alert("Error", json?.message || "Failed to update record");
        return;
      }

      Alert.alert("Success", "Record updated");
      router.back();
    } catch (err) {
      console.error("save record error:", err);
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
        Edit Record
      </Text>

      <TextInput
        placeholder="Title"
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { backgroundColor: colors.surface, color: colors.text },
        ]}
        value={recordTitle}
        onChangeText={setRecordTitle}
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
        multiline
      />

      {/* Date */}
      {Platform.OS === "web" ? (
        <input
          type="date"
          value={date.toISOString().slice(0, 10)}
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
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}
        </>
      )}

      <TextInput
        placeholder="Doctor Name"
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { backgroundColor: colors.surface, color: colors.text },
        ]}
        value={doctorName}
        onChangeText={setDoctorName}
      />

      <TextInput
        placeholder="Hospital Name"
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { backgroundColor: colors.surface, color: colors.text },
        ]}
        value={hospitalName}
        onChangeText={setHospitalName}
      />

      <TextInput
        placeholder="File URL"
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { backgroundColor: colors.surface, color: colors.text },
        ]}
        value={fileUrl}
        onChangeText={setFileUrl}
      />

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
