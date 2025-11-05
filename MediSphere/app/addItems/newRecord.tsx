import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../../hooks/useTheme";
import AppButton from "@/components/appButton";
import { authFetch } from "../../lib/auth";
import BASE_URL from "../../lib/apiconfig";
import { useRouter } from "expo-router";
import rawDocumentTypes from "../../constants/documentTypes.json";

export default function NewRecord() {
  const { styles, colors, sizes } = useTheme();
  const router = useRouter();
  const documentTypes = rawDocumentTypes as Record<string, string[]>;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [doctype, setDoctype] = useState<string | null>(null);
  const [docinfo, setDocinfo] = useState<Record<string, string>>({});
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldModal, setFieldModal] = useState<{ visible: boolean; name: string }>({
    visible: false,
    name: "",
  });
  const [customTypeModal, setCustomTypeModal] = useState(false);
  const [doctypeMenuVisible, setDoctypeMenuVisible] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
    });
    if (!result.canceled && result.assets.length) setFile(result.assets[0]);
  };

  const addField = () => setFieldModal({ visible: true, name: "" });

  const removeField = (key: string) => {
    setDocinfo((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
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
      form.append("doctype", doctype || ""); // optional
      form.append("docinfo", JSON.stringify(docinfo || {}));

      if (file) {
        form.append("file", {
          uri: file.uri,
          name: file.name || "upload.bin",
          type: file.mimeType || "application/octet-stream",
        } as any);
      }

      const res = await authFetch(`${BASE_URL}/records/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (res.ok) {
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

  // when document type changes, load default fields or clear
  useEffect(() => {
    if (doctype && documentTypes[doctype]) {
      const defaults = Object.fromEntries(documentTypes[doctype].map((f) => [f, ""]));
      setDocinfo(defaults);
    } else if (doctype === "Custom") {
      setCustomTypeModal(true);
    } else {
      setDocinfo({});
    }
  }, [doctype]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: sizes.gap }}>
        <Text style={styles.heading}>New Medical Record</Text>

        <Text style={styles.text}>Title*</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={[styles.text, { marginTop: 12 }]}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.text, { marginTop: 12 }]}>Date*</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} />

        <Text style={[styles.text, { marginTop: 12 }]}>Doctor Name</Text>
        <TextInput style={styles.input} value={doctorName} onChangeText={setDoctorName} />

        <Text style={[styles.text, { marginTop: 12 }]}>Hospital Name</Text>
        <TextInput
          style={styles.input}
          value={hospitalName}
          onChangeText={setHospitalName}
        />

        {/* Document type dropdown */}
        <Text style={[styles.text, { marginTop: 16 }]}>Document Type (optional)</Text>
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
          <Text style={{ color: doctype ? colors.text : colors.muted }}>
            {doctype || "Select document type"}
          </Text>
        </TouchableOpacity>

        {/* Doc info fields */}
        {Object.keys(docinfo).length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.text, { fontWeight: "700" }]}>{doctype} Details</Text>
            {Object.entries(docinfo).map(([key, value]) => (
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
                  value={String(value)}
                  onChangeText={(val) =>
                    setDocinfo((prev) => ({ ...prev, [key]: val }))
                  }
                />
              </View>
            ))}
            <TouchableOpacity
              onPress={addField}
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

        <Text style={[styles.text, { marginTop: 16 }]}>Attach File (optional)</Text>
        <TouchableOpacity
          onPress={pickFile}
          style={[
            styles.input,
            { justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0" },
          ]}
        >
          <Text>{file ? file.name : "Choose File (PDF or Image)"}</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 20 }}>
          <AppButton
            title={submitting ? "Submitting..." : "Submit"}
            onPress={handleSubmit}
            disabled={submitting}
          />

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
        </View>
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
                  setDoctype(null);
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
                    setDoctype(t);
                    setDoctypeMenuVisible(false);
                  }}
                  style={{ paddingVertical: 8 }}
                >
                  <Text style={{ color: colors.text }}>{t}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => {
                  setDoctype("Custom");
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
                  if (docinfo[key]) {
                    Alert.alert("Field exists", "This field already exists.");
                    return;
                  }
                  setDocinfo((prev) => ({ ...prev, [key]: "" }));
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
              onChangeText={(v) => setDoctype(v)}
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
