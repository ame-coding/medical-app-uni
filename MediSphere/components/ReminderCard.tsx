import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../hooks/useTheme";
import type { Reminder } from "../hooks/useReminders";

export default function ReminderCard({
  reminder,
  onDelete,
}: {
  reminder: Reminder;
  onDelete: (id: number) => void;
}) {
  const { styles, colors, sizes } = useTheme();

  return (
    <View style={[styles.card, { marginBottom: sizes.gap }]}>
      <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>
        {reminder?.title ?? "Untitled"}
      </Text>

      {reminder?.description ? (
        <Text style={{ marginTop: 4, color: colors.muted }}>
          {reminder.description}
        </Text>
      ) : null}

      <Text style={{ marginTop: 6, color: colors.muted }}>
        {reminder?.date_time
          ? new Date(reminder.date_time).toLocaleString()
          : "No date"}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 10,
        }}
      >
        <TouchableOpacity onPress={() => reminder?.id && onDelete(reminder.id)}>
          <Text style={{ color: colors.error, fontWeight: "700" }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
