import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ New import
import { useTheme } from "../../hooks/useTheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authFetch } from "../../lib/auth";
import BASE_URL from "../../lib/apiconfig";

type Params = { id?: string };

export default function ViewRecord() {
  const { styles, colors } = useTheme();
  const params = useLocalSearchParams() as Params;
  const id = Number(params.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);

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

  const openFile = async (url?: string | null) => {
    if (!url) return;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) return Alert.alert("Invalid URL");
      await Linking.openURL(url);
    } catch (err) {
      console.error("Open file error:", err);
      Alert.alert("Error", "Could not open file");
    }
  };

  if (loading)
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  if (!record)
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.text }}>No record found</Text>
      </View>
    );

  const isImage =
    record.file_url && record.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = record.file_url && record.file_url.match(/\.pdf$/i);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>{record.record_title}</Text>

        <Text style={[styles.text, { marginTop: 6 }]}>
          Date: {record.date || "-"}
        </Text>
        <Text style={styles.text}>
          Doctor: {record.doctor_name || "Unknown"}
        </Text>
        <Text style={styles.text}>
          Hospital: {record.hospital_name || "Unknown"}
        </Text>

        {record.file_url && !record.file_missing ? (
          <View style={{ marginTop: 16 }}>
            {isImage && (
              <Image
                source={{ uri: record.file_url }}
                style={{ width: "100%", aspectRatio: 1, borderRadius: 8 }}
                resizeMode="cover"
              />
            )}

            {isPDF && (
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 16,
                  color: colors.text,
                }}
              >
                📄 {record.file_url.split("/").pop()}
              </Text>
            )}

            <TouchableOpacity
              onPress={() => openFile(record.file_url)}
              style={{
                backgroundColor: colors.primary,
                padding: 10,
                borderRadius: 8,
                marginTop: 12,
              }}
            >
              <Text
                style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}
              >
                Open File
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ color: "red", marginTop: 12 }}>
            {record.file_missing
              ? "⚠️ File not found on server"
              : "No file attached"}
          </Text>
        )}

        {/* Description */}
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.text, { fontWeight: "700" }]}>Notes:</Text>
          <Text style={[styles.text, { marginTop: 6 }]}>
            {record.description || "No description provided."}
          </Text>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "../editItems/editRecord",
              params: { id: record.id },
            })
          }
          style={{
            marginTop: 24,
            backgroundColor: colors.primary,
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text
            style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}
          >
            Edit Record
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/records")}
          style={{
            marginTop: 16,
            padding: 10,
            borderRadius: 8,
            backgroundColor: colors.surface,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: colors.text,
              fontWeight: "600",
            }}
          >
            ← Back to Records
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
