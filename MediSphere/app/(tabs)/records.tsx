import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";
import useRecords from "../../hooks/useRecords";
import { useAuth } from "../../providers/AuthProvider";
import { useFocusEffect } from "@react-navigation/native";
import RecordCard from "../../components/RecordCard";

export default function RecordsScreen() {
  const { styles, sizes, colors } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  const {
    records,
    loading: recordsLoading,
    loadRecords,
    deleteRecord,
  } = useRecords();

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadRecords();
    }, [user, loadRecords])
  );

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
          renderItem={({ item }) => (
            <RecordCard record={item} onDelete={deleteRecord} />
          )}
        />
      )}
    </View>
  );
}
