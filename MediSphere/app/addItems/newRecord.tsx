import React, { useState } from "react";
import { View, Text, TextInput, Alert, ScrollView } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import AppButton from "@/components/appButton";
import { authFetch } from "../../lib/auth";
import BASE_URL from "../../lib/apiconfig";
import { useRouter } from "expo-router";

export default function NewRecord() {
  const { styles, sizes } = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !date) {
      Alert.alert("Required", "Title and Date are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        record_title: title,
        description,
        date,
        doctor_name: doctorName || null,
        hospital_name: hospitalName || null,
        file_url: fileUrl || null,
      };

      const res = await authFetch(`${BASE_URL}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        Alert.alert("Success", "Record added!");
        router.replace("/(tabs)/records"); // navigate back to records list
      } else {
        Alert.alert("Error", data.message || "Failed to add record");
      }
    } catch (err) {
      console.error("Add record error:", err);
      Alert.alert("Error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: sizes.gap }}
    >
      <Text style={styles.heading}>New Medical Record</Text>

      <Text style={styles.text}>Title*</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.text}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.text}>Date*</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.text}>Doctor Name</Text>
      <TextInput
        style={styles.input}
        value={doctorName}
        onChangeText={setDoctorName}
      />

      <Text style={styles.text}>Hospital Name</Text>
      <TextInput
        style={styles.input}
        value={hospitalName}
        onChangeText={setHospitalName}
      />

      <Text style={styles.text}>File URL</Text>
      <TextInput
        style={styles.input}
        value={fileUrl}
        onChangeText={setFileUrl}
      />

      <View style={{ marginTop: 20 }}>
        <AppButton
          title={submitting ? "Submitting..." : "Submit"}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </View>
    </ScrollView>
  );
}
