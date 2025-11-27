// app/addItems/viewRecord.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getToken, authFetch } from "../../lib/auth";
import { downloadWithAuth } from "../../lib/downloadHelper";
import BASE_URL from "../../lib/apiconfig";
import { useChatbotContext } from "../../providers/ChatbotProvider"; // NEW import

export default function ViewRecord() {
  const { styles, colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const chat = useChatbotContext(); // NEW: provider

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // full-screen modal state
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // If reopenChat=1 is present in params, when this screen unmounts we should reopen Kitty.
  useEffect(() => {
    const shouldReopen = String(params?.reopenChat ?? "") === "1";
    if (!shouldReopen) return;

    return () => {
      // delay slightly so navigation transition finishes before modal opens
      setTimeout(() => {
        try {
          chat.open();
        } catch (e) {
          console.warn("[viewRecord] reopen chat failed", e);
        }
      }, 120);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.reopenChat]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${BASE_URL}/records/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
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
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
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
        <Text>No record found</Text>
      </View>
    );

  const isImage =
    record.file_url &&
    /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(
      record.file_url.split("/").pop() || ""
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>{record.record_title}</Text>
        <Text style={[styles.text, { marginBottom: 4 }]}>
          Date: {record.date}
        </Text>
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
            <Text style={[styles.text, { opacity: 0.6 }]}>
              No additional details
            </Text>
          )}
        </View>

        {/* Image preview (small) — tap to open full-screen */}
        {isImage && !record.file_missing && (
          <TouchableOpacity
            onPress={() => setShowImageModal(true)}
            activeOpacity={0.9}
            style={{
              marginTop: 20,
              borderRadius: 10,
              overflow: "hidden",
              alignSelf: "stretch",
            }}
          >
            <Image
              source={{ uri: record.file_url }}
              style={{
                width: "100%",
                height: 200, // small preview portion
                backgroundColor: colors.surface,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Download button if file exists */}
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
            <Text style={{ color: "#fff", textAlign: "center" }}>
              Download File
            </Text>
          </TouchableOpacity>
        )}

        {/* Edit button */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "../addItems/editRecord",
              params: { id: record.id },
            } as any)
          }
          style={{
            marginTop: 16,
            backgroundColor: colors.secondary,
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Edit Record
          </Text>
        </TouchableOpacity>

        {/* Back button */}
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

      {/* Full-screen Image Modal */}
      <Modal
        visible={showImageModal}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
        presentationStyle={
          Platform.OS === "ios" ? "overFullScreen" : "fullScreen"
        }
      >
        <View style={[modalStyles.container, { backgroundColor: "black" }]}>
          <Pressable
            onPress={() => setShowImageModal(false)}
            style={modalStyles.closeArea}
          >
            <Text style={modalStyles.closeText}>✕</Text>
          </Pressable>

          <Image
            source={{ uri: record.file_url }}
            style={modalStyles.fullImage}
            resizeMode="contain"
          />

          <View style={modalStyles.downloadRow}>
            <TouchableOpacity
              onPress={handleDownload}
              style={[
                modalStyles.downloadBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={{ color: "#fff" }}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  closeArea: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
  },
  closeText: {
    color: "#fff",
    fontSize: 18,
  },
  downloadRow: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  downloadBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
});
