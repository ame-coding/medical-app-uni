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
  const { records, loading: recordsLoading, loadRecords, deleteRecord } =
    useRecords();
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadRecords();
    }, [user, loadRecords])
  );

  // handle download using backend route
  const handleDownload = (recordId: number) => {
    const url = `${BASE_URL}/records/download/${recordId}`;
    Linking.openURL(url);
  };

  // render each record item
  const renderRecord = ({ item }: any) => {
    const isImage = item.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPDF = item.file_url?.match(/\.pdf$/i);
    const hasDocInfo = item.doc_info && Object.keys(item.doc_info).length > 0;

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
        {/* Title */}
        <Text style={[styles.text, { fontWeight: "700" }]}>
          {item.record_title}
        </Text>
        <Text style={[styles.mutedText, { marginBottom: 8 }]}>{item.date}</Text>

        {/* File preview */}
        {/* ✅ Handle missing or deleted files gracefully */}
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
                onError={() =>
                  console.warn(`Image failed to load: ${item.file_url}`)
                }
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
            {item.file_missing
              ? "File not found on server"
              : "No file attached"}
          </Text>
        )}

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 10,
          }}
        >
          {/* Download */}
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

          {/* View Details */}
          {hasDocInfo && (
            <TouchableOpacity
              onPress={() => setSelectedDetails(item.doc_info)}
              style={{
                backgroundColor: colors.secondary,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                View Details
              </Text>
            </TouchableOpacity>
          )}

          {/* Full Record */}
      <TouchableOpacity
  onPress={() => router.push(`/records/${item.id}` as any)}
  style={{
    backgroundColor: "#444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  }}
>
  <Text style={{ color: "#fff", fontWeight: "600" }}>Full Record</Text>
</TouchableOpacity>


          {/* Delete Record */}
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

  // initial loading state
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

  return (
    <View style={styles.screen}>
      {/* Header */}
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
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            + Add
          </Text>
        </TouchableOpacity>
      </View>

      {recordsLoading && (
        <ActivityIndicator style={{ marginVertical: sizes.gap }} />
      )}

      {records.length === 0 && !recordsLoading ? (
        <Text style={styles.mutedText}>No records yet.</Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(r) => r.id.toString()}
          renderItem={renderRecord}
        />
      )}

      {/* Modal for doc_info JSON */}
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
            <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 10 }}>
              Record Details
            </Text>
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
