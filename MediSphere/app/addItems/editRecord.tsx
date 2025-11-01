import React, { useEffect, useState } from "react";
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
  const [newFile, setNewFile] = useState<any>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return router.back();
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/records/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRecord(data.record);
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

  const handleSave = async () => {
    if (!record?.record_title) return Alert.alert("Title required");
    setSaving(true);
    try {
      const form = new FormData();
      form.append("record_title", record.record_title);
      form.append("description", record.description || "");
      form.append("date", record.date);
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
      router.back();
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

  const isImage = record?.file_url && record.file_url.match(/\.(jpg|jpeg|png|gif)$/i);
  const isPDF = record?.file_url && record.file_url.match(/\.pdf$/i);

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

      <TextInput
        style={styles.input}
        placeholder="Document Type"
        value={record.doctype || ""}
        onChangeText={(v) => setRecord({ ...record, doctype: v })}
      />

      {record?.file_url && !record.file_missing && !removeFile ? (
        <View style={{ marginTop: 10 }}>
          {isImage && (
            <Image
              source={{ uri: record.file_url }}
              style={{ width: "100%", aspectRatio: 1, borderRadius: 8 }}
            />
          )}
          {isPDF && <Text>📄 {record.file_url.split("/").pop()}</Text>}
          <TouchableOpacity
            onPress={() => setRemoveFile(true)}
            style={{ backgroundColor: "red", padding: 8, borderRadius: 8, marginTop: 8 }}
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
