import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
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
  const [doctype, setDoctype] = useState("");
  const [docinfo, setDocinfo] = useState<Record<string, string>>({});
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const suggestedFields: Record<string, string[]> = useMemo(
    () => ({
      "Blood Test": ["Blood Pressure", "Blood Count"],
      Pharmacy: ["Medicines"],
      "X-Ray": ["Body Part", "Findings"],
      Ultrasound: ["Region", "Observations"],
    }),
    []
  );

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
    });
    if (!result.canceled && result.assets.length) setFile(result.assets[0]);
  };

  const addCustomField = () => {
    const key = `Field ${Object.keys(docinfo).length + 1}`;
    setDocinfo((p) => ({ ...p, [key]: "" }));
  };

  const handleSubmit = async () => {
    if (!title || !date) {
      Alert.alert("Required", "Title and Date are required");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("record_title", title);
      form.append("description", description);
      form.append("date", date);
      form.append("doctor_name", doctorName || "");
      form.append("hospital_name", hospitalName || "");
      form.append("doctype", doctype || "");
      form.append("docinfo", JSON.stringify(docinfo || {}));

      if (file) {
        const name = file.name ?? "upload.bin";
        form.append("file", {
          uri: file.uri,
          name,
          type: file.mimeType ?? "application/octet-stream",
        } as any);
      }

      const res = await authFetch(`${BASE_URL}/records/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (data.ok) {
        Alert.alert("Success", "Record added successfully!");
        router.replace("/(tabs)/records");
      } else {
        Alert.alert("Error", data.message || "Failed to add record");
      }
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Network or server error");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = doctype && suggestedFields[doctype] ? suggestedFields[doctype] : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: sizes.gap }}>
      <Text style={styles.heading}>New Medical Record</Text>

      <Text style={styles.text}>Title*</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.text}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} multiline />

      <Text style={styles.text}>Date*</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} />

      <Text style={styles.text}>Doctor Name</Text>
      <TextInput style={styles.input} value={doctorName} onChangeText={setDoctorName} />

      <Text style={styles.text}>Hospital Name</Text>
      <TextInput style={styles.input} value={hospitalName} onChangeText={setHospitalName} />

      <Text style={[styles.text, { marginTop: 16 }]}>Document Type</Text>
      {["Blood Test", "Pharmacy", "X-Ray", "Ultrasound"].map((t) => (
        <TouchableOpacity
          key={t}
          onPress={() => {
            setDoctype(t);
            setDocinfo({});
          }}
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: doctype === t ? "#007AFF" : "#ccc",
            borderRadius: 8,
            marginVertical: 5,
          }}
        >
          <Text>{t}</Text>
        </TouchableOpacity>
      ))}

      {!!doctype && (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.text, { fontWeight: "700" }]}>{doctype} Details</Text>

          {fields.map((f) => (
            <View key={f}>
              <Text style={styles.text}>{f}</Text>
              <TextInput
                style={styles.input}
                value={docinfo[f] || ""}
                onChangeText={(v) => setDocinfo((p) => ({ ...p, [f]: v }))}
              />
            </View>
          ))}

          {Object.keys(docinfo)
            .filter((k) => !fields.includes(k))
            .map((k) => (
              <View key={k}>
                <Text style={styles.text}>{k}</Text>
                <TextInput
                  style={styles.input}
                  value={docinfo[k]}
                  onChangeText={(v) => setDocinfo((p) => ({ ...p, [k]: v }))}
                />
              </View>
            ))}

          <TouchableOpacity
            onPress={addCustomField}
            style={{ marginTop: 10, backgroundColor: "#eee", padding: 10, borderRadius: 8, alignItems: "center" }}
          >
            <Text>+ Add Custom Field</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.text, { marginTop: 16 }]}>Attach File (optional)</Text>
      <TouchableOpacity
        onPress={pickFile}
        style={[styles.input, { justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0" }]}
      >
        <Text>{file ? file.name : "Choose File (PDF or Image)"}</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <AppButton title={submitting ? "Submitting..." : "Submit"} onPress={handleSubmit} disabled={submitting} />
      </View>
    </ScrollView>
  );
}
