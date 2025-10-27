// app/addItems/viewRecord.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authFetch } from "../../lib/auth";
import BASE_URL from "../../lib/apiconfig";

type Params = { id?: string };

export default function ViewRecord() {
  const { styles, sizes, colors } = useTheme();
  const params = useLocalSearchParams() as Params;
  const id = Number(params.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Missing record id");
      router.back();
      return;
    }
    fetchRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRecord = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/records/${id}`);
      const raw = await res.text();
      let json = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        Alert.alert("Error", json?.message || "Failed to load record");
        router.back();
        return;
      }

      setRecord(json.record);
    } catch (err) {
      console.error("fetchRecord error:", err);
      Alert.alert("Error", "Network error");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (url?: string | null) => {
    if (!url) return;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert("Cannot open link", "Invalid URL");
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      console.error("openFile error:", err);
      Alert.alert("Error", "Failed to open file URL");
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!record) {
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={styles.text}>Record not found</Text>
      </View>
    );
  }

  // Header padding for Android status bar fallback
  const androidTop =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with safe padding */}
      <View
        style={[
          headerStyles.header,
          {
            paddingTop: androidTop > 0 ? androidTop / 2 : 0,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={headerStyles.headerBtn}
        >
          <Text
            style={[styles.text, { color: colors.text, fontWeight: "600" }]}
          >
            Back
          </Text>
        </TouchableOpacity>

        <Text style={[styles.text, headerStyles.headerTitle]}>Record</Text>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/addItems/editRecord",
              params: { id: record.id },
            })
          }
          style={headerStyles.headerBtn}
        >
          <Text
            style={[styles.text, { color: colors.primary, fontWeight: "700" }]}
          >
            Edit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Center content: use ScrollView so long descriptions still scroll */}
      <ScrollView
        contentContainerStyle={[viewStyles.scrollContainer, { padding: 16 }]}
      >
        <View
          style={[
            styles.card,
            viewStyles.card,
            { width: "100%", maxWidth: 820 },
          ]}
        >
          <Text style={[styles.heading, { marginBottom: 6 }]}>
            {record.record_title}
          </Text>
          <Text style={styles.mutedText}>Date: {record.date}</Text>
          <Text style={styles.mutedText}>
            Doctor: {record.doctor_name || "-"}
          </Text>
          <Text style={styles.mutedText}>
            Hospital: {record.hospital_name || "-"}
          </Text>

          <Text style={{ marginTop: 10, color: colors.text }}>
            {record.description || "No additional notes."}
          </Text>

          {record.file_url ? (
            <TouchableOpacity
              onPress={() => openFile(record.file_url)}
              style={{ marginTop: 12 }}
            >
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                Open attached file
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.mutedText, { marginTop: 12 }]}>
            Created: {record.created_at}
          </Text>

          <View
            style={{
              marginTop: 16,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity onPress={() => router.replace("/(tabs)/records")}>
              <Text style={{ color: colors.muted }}>Back to list</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/addItems/editRecord",
                  params: { id: record.id },
                })
              }
            >
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const headerStyles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 56,
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  headerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
});

const viewStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center", // vertical center
    alignItems: "center", // horizontal center
  },
  card: {
    padding: 16,
  },
});
