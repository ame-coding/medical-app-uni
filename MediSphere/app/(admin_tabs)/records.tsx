// app/(admin_tabs)/records.tsx
import React from "react";
import { View, Text, FlatList } from "react-native";
import { useTheme } from "../../hooks/useTheme";

const DUMMY_RECORDS = Array.from({ length: 12 }).map((_, i) => ({
  id: `rec${i + 1}`,
  title: `Medical Record #${i + 1}`,
  doctor: `Dr. ${["Smith", "Jones", "Brown", "Taylor"][i % 4]}`,
  date: `2023-10-${i + 10}`,
}));

export default function RecordsScreen() {
  const { styles, colors } = useTheme();

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>All Records</Text>
      <FlatList
        data={DUMMY_RECORDS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.text}>{item.title}</Text>
            <Text style={styles.mutedText}>Provider: {item.doctor}</Text>
            <Text style={{ color: colors.primary }}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}
