// app/addItems/newRecord.tsx
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
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../../hooks/useTheme";
import AppButton from "@/components/appButton";
import { authFetch } from "../../lib/auth";
import BASE_URL from "../../lib/apiconfig";
import { useRouter } from "expo-router";

const guessExt = (mime?: string) =>
  mime?.includes("pdf")
    ? "pdf"
    : mime?.includes("png")
    ? "png"
    : mime?.includes("jpeg")
    ? "jpg"
    : mime?.includes("jpg")
    ? "jpg"
    : mime?.includes("gif")
    ? "gif"
    : "bin";

async function toFormDataPart(asset: DocumentPicker.DocumentPickerAsset) {
  const name = asset.name ?? `upload.${guessExt(asset.mimeType ?? "")}`;
  const type = asset.mimeType ?? "application/octet-stream";

  if (Platform.OS === "web") {
    const resp = await fetch(asset.uri);
    const blob = await resp.blob();
    return { kind: "web", blob, name };
  }
  const rnFile: any = { uri: asset.uri, name, type };
  return { kind: "native", value: rnFile };
}

export default function NewRecord() {
  const { styles, sizes } = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("");
  const [docInfo, setDocInfo] = useState<Record<string, string>>({});
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.error("File selection error:", err);
      Alert.alert("Error", "Could not select file");
    }
  };

  const handleSubmit = async () => {
    if (!title || !date) {
      Alert.alert("Required", "Title and Date are required");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("record_title", title);
      formData.append("description", description);
      formData.append("date", date);
      formData.append("doctor_name", doctorName || "");
      formData.append("hospital_name", hospitalName || "");
      formData.append("doctype", selectedDocType || "");
      formData.append("docinfo", JSON.stringify(docInfo));

     if (file) {
  const part = await toFormDataPart(file);
  if (part.kind === "web" && part.blob) {
    formData.append("file", part.blob, part.name);
  } else if (part.kind === "native") {
    formData.append("file", part.value);
  }
}


      const res = await authFetch(`${BASE_URL}/records/upload`, {
        method: "POST",
        body: formData,
      });

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

      <Text style={styles.text}>Attach File (optional)</Text>
      <TouchableOpacity
        onPress={pickFile}
        style={[
          styles.input,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f0f0f0",
          },
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
      </View>
    </ScrollView>
  );
}
