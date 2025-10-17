// app/(tabs)/records.tsx
import React, { useCallback, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { authFetch } from "../../lib/auth";
import BASE_URL from "../../lib/apiconfig";
import { useAuth } from "../../providers/AuthProvider";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AppButton from "@/components/appButton";

export default function RecordsScreen() {
  const { styles, sizes } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load records
  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const res = await authFetch(`${BASE_URL}/records`);
      const json = await res.json();
      if (json.ok) setRecords(json.records || []);
      else Alert.alert("Error", json.message || "Failed to load records");
    } catch (err) {
      console.error("fetch records err", err);
      Alert.alert("Error", "Network error");
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  // Refresh when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      if (!user) {
        router.replace("/(auth)/login");
        return;
      }
      load();
    }, [loading, user, load, router])
  );

  const handleDelete = async (id: number) => {
    console.log("handleDelete called with id:", id);
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await authFetch(`${BASE_URL}/records/${id}`, {
                method: "DELETE",
              });

              console.log("Raw response:", res);

              let data;
              try {
                data = await res.json();
              } catch (err) {
                console.error("JSON parse error:", err);
                data = null;
              }

              console.log("Parsed data:", data);

              if (data?.ok) {
                Alert.alert("Deleted", "Record removed successfully");
                setRecords(records.filter((r) => r.id !== id));
              } else {
                Alert.alert(
                  "Error",
                  data?.message || `Failed to delete (status ${res.status})`
                );
              }
            } catch (err) {
              console.error("Network error:", err);
              Alert.alert("Error", "Network error");
            }
          },
        },
      ]
    );
  };

  if (loading)
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  if (!user) return null;

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Medical Records</Text>
      <Text style={styles.mutedText}>Tap any record to view details</Text>

      <FlatList
        style={{ marginTop: sizes.gap }}
        data={records}
        keyExtractor={(i) => String(i.id)}
        refreshing={refreshing}
        onRefresh={load}
        renderItem={({ item }) => (
          <View style={[styles.card, { marginBottom: sizes.gap }]}>
            <Text style={styles.heading}>
              {item.record_title ?? item.title}
            </Text>
            <Text style={styles.mutedText}>{item.date}</Text>
            <Text style={{ marginTop: 8 }}>
              {item.description ?? item.note}
            </Text>
            <View
              style={{
                marginTop: 12,
                flexDirection: "row",
                justifyContent: "flex-end",
              }}
            >
              <AppButton
                title="Delete"
                onPress={() => handleDelete(item.id)}
                bgColor="red" // red button
                textColor="white" // white text
              />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ marginTop: sizes.gap }}>
            <Text style={styles.mutedText}>No records yet.</Text>
          </View>
        )}
      />
    </View>
  );
}
