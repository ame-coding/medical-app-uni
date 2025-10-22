// app/(tabs)/reminders.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import useReminders from "../../hooks/useReminders";
import { useTheme } from "../../hooks/useTheme";
import ReminderCard from "../../components/ReminderCard";

export default function Reminders() {
  const { styles, colors, sizes } = useTheme();
  const router = useRouter();
  const { reminders, loading, cancelAndClear } = useReminders();

  const handleDelete = (id: number) => {
    cancelAndClear(id, null);
  };

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
        <Text style={styles.heading}>Reminders</Text>

        <TouchableOpacity
          onPress={() => router.push("../addItems/newReminders")}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            + Add
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? <Text style={styles.mutedText}>Loading...</Text> : null}

      {reminders.length === 0 && !loading ? (
        <Text style={styles.mutedText}>No reminders yet.</Text>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(r) => r.id.toString()}
          renderItem={({ item }) => (
            <ReminderCard reminder={item} onDelete={handleDelete} />
          )}
        />
      )}
    </View>
  );
}
