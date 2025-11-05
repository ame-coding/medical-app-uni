import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../../hooks/useTheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import BASE_URL from "../../lib/apiconfig";
import { authFetch } from "../../lib/auth";
import rawDocumentTypes from "../../constants/documentTypes.json";

export default function EditRecord() {
  const { styles, colors, sizes } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const documentTypes = rawDocumentTypes as Record<string, string[]>;
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFile, setNewFile] = useState<any>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [fieldModal, setFieldModal] = useState<{ visible: boolean; name: string }>({
    visible: false,
    name: "",
  });
  const [customTypeModal, setCustomTypeModal] = useState(false);
  const [doctypeMenuVisible, setDoctypeMenuVisible] = useState(false);

  const fetchRecord = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/records/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRecord({
        ...data.record,
        docinfo: data.record.docinfo || {},
      });
    } catch (e) {
      console.error("Fetch error:", e);
      Alert.alert("Error", "Failed to load record");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const pickNewFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
    });
    if (!result.canceled && result.assets.length) setNewFile(result.assets[0]);
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
      <SafeAreaView
        style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );

  const removeField = (key: string) =>
    setRecord((r: any) => {
      const updated = { ...(r.docinfo || {}) };
      delete updated[key];
      return { ...r, docinfo: updated };
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: sizes.gap }}>
        <Text style={styles.heading}>Edit Medical Record</Text>

        <Text style={styles.text}>Title*</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={record.record_title}
          onChangeText={(v) => setRecord({ ...record, record_title: v })}
        />

        <Text style={[styles.text, { marginTop: 12 }]}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          placeholder="Description"
          multiline
          value={record.description}
          onChangeText={(v) => setRecord({ ...record, description: v })}
        />

        <Text style={[styles.text, { marginTop: 12 }]}>Date*</Text>
        <TextInput
          style={styles.input}
          placeholder="Date"
          value={record.date}
          onChangeText={(v) => setRecord({ ...record, date: v })}
        />

        <Text style={[styles.text, { marginTop: 12 }]}>Doctor Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Doctor Name"
          value={record.doctor_name}
          onChangeText={(v) => setRecord({ ...record, doctor_name: v })}
        />

        <Text style={[styles.text, { marginTop: 12 }]}>Hospital Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Hospital Name"
          value={record.hospital_name}
          onChangeText={(v) => setRecord({ ...record, hospital_name: v })}
        />

        {/* Document type dropdown */}
        <Text style={[styles.text, { marginTop: 12 }]}>Document Type (optional)</Text>
        <TouchableOpacity
          onPress={() => setDoctypeMenuVisible(true)}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ color: record.doctype ? colors.text : colors.muted }}>
            {record.doctype || "Select document type"}
          </Text>
        </TouchableOpacity>

        {!!record.docinfo && Object.keys(record.docinfo).length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.text, { fontWeight: "700" }]}>
              {record.doctype} Details
            </Text>
            {Object.entries(record.docinfo).map(([key, value]) => (
              <View key={key} style={{ marginBottom: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.text}>{key}</Text>
                  <TouchableOpacity onPress={() => removeField(key)}>
                    <Text style={{ color: "#c00", fontWeight: "700" }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={String(value || "")}
                  onChangeText={(val) =>
                    setRecord((r: any) => ({
                      ...r,
                      docinfo: { ...(r.docinfo || {}), [key]: val },
                    }))
                  }
                />
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setFieldModal({ visible: true, name: "" })}
              style={{
                marginTop: 10,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 10,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.text }}>+ Add Field</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* File upload / replace */}
        {record.file_url && !removeFile ? (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.text}>Attached File</Text>
            <Image
              source={{ uri: record.file_url }}
              style={{ width: "100%", height: 200, borderRadius: 8 }}
            />
            <TouchableOpacity
              onPress={() => setRemoveFile(true)}
              style={[styles.button, { backgroundColor: "#c00", marginTop: 8 }]}
            >
              <Text style={styles.buttonText}>Remove File</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.text}>Upload New File (optional)</Text>
            <TouchableOpacity
              onPress={pickNewFile}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.text }}>
                {newFile ? newFile.name : "Choose File (PDF or Image)"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.button,
            { backgroundColor: colors.primary, marginTop: 20 },
          ]}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/records")}
          style={{
            marginTop: 10,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            padding: 10,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.text }}>← Back to Records</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Document type menu */}
      <Modal visible={doctypeMenuVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              width: "100%",
              maxHeight: "80%",
            }}
          >
            <Text style={[styles.text, { fontWeight: "700", marginBottom: 8 }]}>
              Select Document Type
            </Text>

            <ScrollView>
              <TouchableOpacity
                onPress={() => {
                  setRecord((r: any) => ({ ...r, doctype: "", docinfo: {} }));
                  setDoctypeMenuVisible(false);
                }}
                style={{ paddingVertical: 8 }}
              >
                <Text style={{ color: colors.text }}>None</Text>
              </TouchableOpacity>

              {Object.keys(documentTypes).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    const defaults = Object.fromEntries(
                      documentTypes[t].map((f) => [f, ""])
                    );
                    setRecord((r: any) => ({
                      ...r,
                      doctype: t,
                      docinfo: defaults,
                    }));
                    setDoctypeMenuVisible(false);
                  }}
                  style={{ paddingVertical: 8 }}
                >
                  <Text style={{ color: colors.text }}>{t}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => {
                  setRecord((r: any) => ({ ...r, doctype: "", docinfo: {} }));
                  setDoctypeMenuVisible(false);
                  setCustomTypeModal(true);
                }}
                style={{ paddingVertical: 8 }}
              >
                <Text style={{ color: colors.text }}>Custom</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setDoctypeMenuVisible(false)}
              style={{ marginTop: 10, alignSelf: "flex-end" }}
            >
              <Text style={{ color: colors.muted }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Field Modal */}
      <Modal visible={fieldModal.visible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              width: "100%",
            }}
          >
            <Text style={[styles.text, { fontWeight: "700" }]}>New Field</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter field name"
              placeholderTextColor={colors.muted}
              value={fieldModal.name}
              onChangeText={(t) => setFieldModal((p) => ({ ...p, name: t }))}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setFieldModal({ visible: false, name: "" })}
              >
                <Text style={{ color: colors.muted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const key = fieldModal.name.trim();
                  if (!key) return;
                  if (record.docinfo?.[key]) {
                    Alert.alert("Field exists", "This field already exists.");
                    return;
                  }
                  setRecord((r: any) => ({
                    ...r,
                    docinfo: { ...(r.docinfo || {}), [key]: "" },
                  }));
                  setFieldModal({ visible: false, name: "" });
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Type Modal */}
      <Modal visible={customTypeModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              width: "100%",
            }}
          >
            <Text style={[styles.text, { fontWeight: "700" }]}>Custom Type</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter custom type name"
              placeholderTextColor={colors.muted}
              onChangeText={(v) => setRecord({ ...record, doctype: v })}
            />
            <TouchableOpacity
              onPress={() => setCustomTypeModal(false)}
              style={[
                styles.button,
                { backgroundColor: colors.primary, marginTop: 10 },
              ]}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
