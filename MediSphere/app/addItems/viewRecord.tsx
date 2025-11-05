import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getToken, authFetch } from "../../lib/auth";
import { downloadWithAuth } from "../../lib/downloadHelper";
import BASE_URL from "../../lib/apiconfig";

export default function ViewRecord() {
  const { styles, colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/records/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRecord(data.record);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load record");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Unauthorized", "Please log in again.");
        return;
      }
      const filename = record.file_url.split("/").pop();
      await downloadWithAuth(record.id, filename, token, BASE_URL);
    } catch (err) {
      console.error("Download error:", err);
      Alert.alert("Error", "Could not download file");
    }
  };

  if (loading)
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );

  if (!record)
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <Text>No record found</Text>
      </View>
    );

  const isImage =
    record.file_url &&
    /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(record.file_url.split("/").pop() || "");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>{record.record_title}</Text>
        <Text style={[styles.text, { marginBottom: 4 }]}>Date: {record.date}</Text>
        <Text style={styles.text}>Doctor: {record.doctor_name || "—"}</Text>
        <Text style={styles.text}>Hospital: {record.hospital_name || "—"}</Text>
        <Text style={styles.text}>Type: {record.doctype || "—"}</Text>

        <View style={{ marginTop: 10 }}>
          <Text style={[styles.text, { fontWeight: "700" }]}>Details:</Text>
          {Object.entries(record.docinfo || {}).length ? (
            Object.entries(record.docinfo).map(([k, v]: any) => (
              <Text key={k} style={styles.text}>
                {k}: {String(v)}
              </Text>
            ))
          ) : (
            <Text style={[styles.text, { opacity: 0.6 }]}>No additional details</Text>
          )}
        </View>

        {/* ✅ Image preview if file is an image */}
        {isImage && !record.file_missing && (
          <Image
            source={{ uri: record.file_url }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 10,
              marginTop: 20,
              marginBottom: 10,
              backgroundColor: colors.surface,
            }}
            resizeMode="cover"
          />
        )}

        {/* ✅ Download button if file exists */}
        {record.file_url && !record.file_missing && (
          <TouchableOpacity
            onPress={handleDownload}
            style={{
              marginTop: 10,
              backgroundColor: colors.primary,
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>Download File</Text>
          </TouchableOpacity>
        )}

        {/* ✅ Edit button */}
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "../addItems/editRecord", params: { id: record.id } })
          }
          style={{
            marginTop: 16,
            backgroundColor: colors.secondary,
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Edit Record</Text>
        </TouchableOpacity>

        {/* ✅ Back button */}
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
    </SafeAreaView>
  );
}
