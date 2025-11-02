import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import BASE_URL from "../../lib/apiconfig";
import { authFetch } from "../../lib/auth";

export default function EditRecord() {
  const { styles, colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);
  const [newFile, setNewFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const suggestedFields: Record<string, string[]> = useMemo(
    () => ({
      "Blood Test": ["Blood Pressure", "Blood Count"],
      Pharmacy: ["Medicines"],
      "X-Ray": ["Body Part", "Findings"],
      Ultrasound: ["Region", "Observations"],
    }),
    []
  );

  useEffect(() => {
    if (!id) return router.back();
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/records/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRecord({
        ...data.record,
        docinfo: data.record.docinfo || {},
      });
    } catch (err) {
      console.error("Fetch record error:", err);
      Alert.alert("Error", "Failed to load record");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickNewFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (res.assets?.length) setNewFile(res.assets[0]);
    } catch (err) {
      console.error("File picker error:", err);
      Alert.alert("Error", "Could not select file");
    }
  };

  const addCustomField = () => {
    const key = `Field ${Object.keys(record.docinfo || {}).length + 1}`;
    setRecord((r: any) => ({
      ...r,
      docinfo: { ...(r.docinfo || {}), [key]: "" },
    }));
  };

  const handleSave = async () => {
    if (!record?.record_title) return Alert.alert("Title required");
    setSaving(true);
    try {
      const form = new FormData();
      form.append("record_title", record.record_title);
      form.append("description", record.description || "");
      form.append("date", record.date || "");
      form.append("doctor_name", record.doctor_name || "");
      form.append("hospital_name", record.hospital_name || "");
      form.append("doctype", record.doctype || "");
      form.append("docinfo", JSON.stringify(record.docinfo || {}));
      form.append("remove_file", removeFile ? "true" : "false");

      if (newFile) {
        form.append("file", {
          uri: newFile.uri,
          name: newFile.name || "upload.jpg",
          type: newFile.mimeType || "application/octet-stream",
        } as any);
      }

      const res = await authFetch(`${BASE_URL}/records/${id}`, {
        method: "PUT",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Alert.alert("Success", "Record updated");
      router.replace("/(tabs)/records");
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Error", "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
      </View>
    );

  const fullUrl = record?.file_url;
  const isImage = fullUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = fullUrl?.match(/\.pdf$/i);
  const fields = record?.doctype && suggestedFields[record.doctype] ? suggestedFields[record.doctype] : [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Edit Record</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={record.record_title}
        onChangeText={(v) => setRecord({ ...record, record_title: v })}
      />

      <TextInput
        style={[styles.input, { minHeight: 100 }]}
        placeholder="Description"
        multiline
        value={record.description}
        onChangeText={(v) => setRecord({ ...record, description: v })}
      />

      <TextInput
        style={styles.input}
        placeholder="Date"
        value={record.date}
        onChangeText={(v) => setRecord({ ...record, date: v })}
      />

      <TextInput
        style={styles.input}
        placeholder="Doctor Name"
        value={record.doctor_name}
        onChangeText={(v) => setRecord({ ...record, doctor_name: v })}
      />

      <TextInput
        style={styles.input}
        placeholder="Hospital Name"
        value={record.hospital_name}
        onChangeText={(v) => setRecord({ ...record, hospital_name: v })}
      />

      <Text style={[styles.text, { marginTop: 12 }]}>Document Type</Text>
      {["Blood Test", "Pharmacy", "X-Ray", "Ultrasound"].map((t) => (
        <TouchableOpacity
          key={t}
          onPress={() => setRecord({ ...record, doctype: t, docinfo: {} })}
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: record.doctype === t ? "#007AFF" : "#ccc",
            borderRadius: 8,
            marginVertical: 5,
          }}
        >
          <Text>{t}</Text>
        </TouchableOpacity>
      ))}

      {!!record.doctype && (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.text, { fontWeight: "700" }]}>{record.doctype} Details</Text>

          {fields.map((label) => (
            <View key={label}>
              <Text style={styles.text}>{label}</Text>
              <TextInput
                style={styles.input}
                value={record.docinfo?.[label] || ""}
                onChangeText={(val) =>
                  setRecord((r: any) => ({
                    ...r,
                    docinfo: { ...(r.docinfo || {}), [label]: val },
                  }))
                }
              />
            </View>
          ))}

          {Object.keys(record.docinfo || {})
            .filter((k) => !fields.includes(k))
            .map((k) => (
              <View key={k}>
                <Text style={styles.text}>{k}</Text>
                <TextInput
                  style={styles.input}
                  value={record.docinfo[k]}
                  onChangeText={(v) =>
                    setRecord((r: any) => ({
                      ...r,
                      docinfo: { ...(r.docinfo || {}), [k]: v },
                    }))
                  }
                />
              </View>
            ))}

          <TouchableOpacity
            onPress={addCustomField}
            style={{
              marginTop: 8,
              backgroundColor: "#eee",
              padding: 10,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text>+ Add Custom Field</Text>
          </TouchableOpacity>
        </View>
      )}

      {record?.file_url && !record.file_missing && !removeFile ? (
        <View style={{ marginTop: 10 }}>
          {isImage && (
            <Image
              source={{ uri: fullUrl }}
              style={{ width: "100%", aspectRatio: 1, borderRadius: 8 }}
            />
          )}
          {isPDF && <Text>📄 {fullUrl.split("/").pop()}</Text>}
          <TouchableOpacity
            onPress={() => setRemoveFile(true)}
            style={{
              backgroundColor: "red",
              padding: 8,
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>Remove File</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={pickNewFile}
          style={{
            backgroundColor: "#eee",
            borderRadius: 8,
            padding: 12,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text>{newFile ? newFile.name : "Upload New File (optional)"}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{
          marginTop: 20,
          backgroundColor: colors.primary,
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
          {saving ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
