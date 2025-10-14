import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

const DUMMY_REMINDERS = [
  { id: "rem1", time: "Tomorrow at 8:00 AM", task: "Take Vitamin D" },
  {
    id: "rem2",
    time: "Oct 28, 2023 at 2:00 PM",
    task: "Appointment with Dr. Smith",
  },
  { id: "rem3", time: "Nov 01, 2023 at 10:00 AM", task: "Refill prescription" },
];

export default function RemindersScreen() {
  const { styles } = useTheme();

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Reminders</Text>
      <FlatList
        data={DUMMY_REMINDERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.text}>{item.task}</Text>
            <Text style={styles.mutedText}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}
