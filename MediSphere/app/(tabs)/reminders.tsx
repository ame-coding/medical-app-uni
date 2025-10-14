import React from "react";
import { View, Text, FlatList } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import AppButton from "../../components/appButton";

const DUMMY_REMINDERS = [
  { id: "r1", time: "Tomorrow, 8:00 AM", task: "Take Vitamin D" },
  { id: "r2", time: "Oct 28, 2:00 PM", task: "Dentist appointment" },
];

export default function RemindersScreen() {
  const { styles, sizes } = useTheme();

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Reminders</Text>
      <Text style={styles.mutedText}>
        Stay on top of medicines and appointments
      </Text>

      <FlatList
        style={{ marginTop: sizes.gap }}
        data={DUMMY_REMINDERS}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { marginBottom: sizes.gap }]}>
            <Text style={styles.heading}>{item.task}</Text>
            <Text style={styles.mutedText}>{item.time}</Text>
            <View style={{ marginTop: 10 }}>
              <AppButton
                title="Mark Done"
                variant="outline"
                onPress={() => {}}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}
