import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Linking,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";
import useRecords from "../../hooks/useRecords";
import { useAuth } from "../../providers/AuthProvider";
import { useFocusEffect } from "@react-navigation/native";
import BASE_URL from "../../lib/apiconfig";

export default function RecordsScreen() {
  const { styles, sizes, colors } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { records, loading: recordsLoading, loadRecords, deleteRecord } = useRecords();
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadRecords();
    }, [user, loadRecords])
  );

  const handleDownload = (id: number) => {
    const url = `${BASE_URL}/records/download/${id}`;
    Linking.openURL(url);
  };

  const renderRecord = ({ item }: any) => {
    const isImage = item.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPDF = item.file_url?.match(/\.pdf$/i);
    const hasDocInfo = item.docinfo && Object.keys(item.docinfo).length > 0;

    return (
      <View
        style={{
          backgroundColor: colors.background,
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          elevation: 2,
        }}
      >
        <Text style={[styles.text, { fontWeight: "700" }]}>{item.record_title}</Text>
        <Text style={[styles.mutedText, { marginBottom: 8 }]}>{item.date}</Text>

        {item.file_url && !item.file_missing ? (
          <>
            {isImage && (
              <Image
                source={{ uri: item.file_url }}
                style={{
                  width: "100%",
                  aspectRatio: 1,
                  borderRadius: 10,
                  backgroundColor: "#f5f5f5",
                }}
                resizeMode="cover"
              />
            )}
            {isPDF && (
              <View
                style={{
                  backgroundColor: "#f3f3f3",
                  padding: 10,
                  borderRadius: 8,
                  marginTop: 4,
                }}
              >
                <Text>📄 {item.file_url.split("/").pop()}</Text>
              </View>
            )}
          </>
        ) : (
          <Text
            style={{
              color: "red",
              marginTop: 6,
              fontStyle: "italic",
            }}
          >
            {item.file_missing ? "File not found" : "No file attached"}
          </Text>
        )}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          {item.file_url && !item.file_missing && (
            <TouchableOpacity
              onPress={() => handleDownload(item.id)}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Download</Text>
            </TouchableOpacity>
          )}

          {hasDocInfo && (
            <TouchableOpacity
              onPress={() => setSelectedDetails(item.docinfo)}
              style={{
                backgroundColor: colors.secondary,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>View Details</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push({ pathname: "../addItems/viewRecord", params: { id: item.id } })}
            style={{
              backgroundColor: "#444",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Full Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({ pathname: "../addItems/editRecord", params: { id: item.id } })}
            style={{
              backgroundColor: "#6c5ce7",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => deleteRecord(item.id)}
            style={{
              backgroundColor: "#d9534f",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <View style={styles.screen}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: sizes.gap,
        }}
      >
        <Text style={styles.heading}>Medical Records</Text>
        <TouchableOpacity onPress={() => router.push("../addItems/newRecord")}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {recordsLoading && <ActivityIndicator style={{ marginVertical: sizes.gap }} />}

      {records.length === 0 && !recordsLoading ? (
        <Text style={styles.mutedText}>No records yet.</Text>
      ) : (
        <FlatList data={records} keyExtractor={(r) => r.id.toString()} renderItem={renderRecord} />
      )}

      <Modal
        visible={!!selectedDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDetails(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              width: "100%",
              maxHeight: "80%",
              padding: 16,
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 10 }}>Record Details</Text>
            <ScrollView>
              {Object.entries(selectedDetails || {}).map(([key, value]) => (
                <View key={key} style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: "600" }}>{key}</Text>
                  <Text>{String(value)}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setSelectedDetails(null)}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
