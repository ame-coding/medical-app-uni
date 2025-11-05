import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";
import { authFetch, getToken } from "../../lib/auth";
import { downloadWithAuth } from "../../lib/downloadHelper";
import BASE_URL from "../../lib/apiconfig";

export default function RecordsScreen() {
  const { styles, colors } = useTheme();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  

  // ✅ Fetch all records directly using authFetch
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${BASE_URL}/records`);
      const data = await res.json();

      if (!res.ok) {
        console.error("Fetch error:", data);
        Alert.alert("Error", data.message || "Failed to load records");
        setRecords([]);
        return;
      }

      setRecords(Array.isArray(data.records) ? data.records : data);
    } catch (err) {
      console.error("Network error:", err);
      Alert.alert("Error", "Could not fetch records. Please try again.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ✅ Delete record
  const handleDelete = async (id: number) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await authFetch(`${BASE_URL}/records/${id}`, {
              method: "DELETE",
            });
            if (!res.ok) {
              const data = await res.json();
              Alert.alert("Error", data.message || "Failed to delete");
              return;
            }
            setRecords((prev) => prev.filter((r) => r.id !== id));
          } catch (err) {
            console.error("Delete error:", err);
            Alert.alert("Error", "Failed to delete record");
          }
        },
      },
    ]);
  };

  // ✅ Download
  const handleDownload = useCallback(async (id: number, filename: string) => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Unauthorized", "Please log in again.");
        return;
      }
      await downloadWithAuth(id, filename, token, BASE_URL);
    } catch (err) {
      console.error("Download error:", err);
      Alert.alert("Error", "Download failed");
    }
  }, []);

  // ✅ Render each record item
  const renderItem = ({ item }: any) => {
    const isImage =
      item.file_url &&
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(item.file_url.split("/").pop() || "");

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
        }}
      >
        <Text style={[styles.text, { fontWeight: "700", fontSize: 16 }]}>
          {item.record_title}
        </Text>
        <Text style={[styles.text, { marginBottom: 4 }]}>{item.date}</Text>

        {isImage && (
  <Image
    source={{ uri: item.file_url }}
    style={{
      width: "100%",
      height: 150,
      borderRadius: 8,
      marginBottom: 8,
    }}
    resizeMode="cover"
  />
)}


        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {item.file_url && !item.file_missing && (
            <TouchableOpacity
              onPress={() => handleDownload(item.id, item.file_url.split("/").pop())}
              style={{
                backgroundColor: colors.primary,
                padding: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff" }}>Download</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: "../addItems/viewRecord", params: { id: item.id } })
            }
            style={{
              backgroundColor: "#444",
              padding: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff" }}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: "../addItems/editRecord", params: { id: item.id } })
            }
            style={{
              backgroundColor: "#6c5ce7",
              padding: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff" }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={{
              backgroundColor: "#d9534f",
              padding: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff" }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ✅ Loader
  if (loading)
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );

  // ✅ Empty state
  if (!records.length)
    return (
      <View
        style={[styles.screen, { justifyContent: "center", alignItems: "center", gap: 12 }]}
      >
        <Text style={[styles.text, { opacity: 0.7 }]}>
          No records found. Add a new one!
        </Text>
        <TouchableOpacity
          onPress={() => router.push("../addItems/newRecord")}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>+ New Record</Text>
        </TouchableOpacity>
      </View>
    );

  // ✅ Main list
  return (
    <View style={[styles.screen, { paddingHorizontal: 12 }]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={[styles.heading, { marginBottom: 0 }]}>Medical Records</Text>
        <TouchableOpacity
          onPress={() => router.push("../addItems/newRecord")}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(r) => r.id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
