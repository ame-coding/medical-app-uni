import React from "react";
import { View, Text, FlatList } from "react-native";
import { useTheme } from "../../hooks/useTheme";

const DUMMY_RECORDS = [
  { id: "1", title: "Annual Check-up", date: "2023-10-26", note: "All clear" },
  { id: "2", title: "Blood Test", date: "2023-09-15", note: "Slight iron low" },
  { id: "3", title: "X-Ray (arm)", date: "2023-07-02", note: "Healed" },
];

export default function RecordsScreen() {
  const { styles, sizes } = useTheme();

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Medical Records</Text>
      <Text style={styles.mutedText}>Tap any record to view details</Text>

      <FlatList
        style={{ marginTop: sizes.gap }}
        data={DUMMY_RECORDS}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { marginBottom: sizes.gap }]}>
            <Text style={styles.heading}>{item.title}</Text>
            <Text style={styles.mutedText}>{item.date}</Text>
            <Text style={{ marginTop: 8 }}>{item.note}</Text>
          </View>
        )}
      />
    </View>
  );
}
