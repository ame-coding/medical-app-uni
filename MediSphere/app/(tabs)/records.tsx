import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

const DUMMY_RECORDS = [
  {
    id: "rec1",
    date: "2023-10-26",
    title: "Annual Check-up",
    doctor: "Dr. Smith",
  },
  {
    id: "rec2",
    date: "2023-09-15",
    title: "Blood Test Results",
    doctor: "LabCorp",
  },
  {
    id: "rec3",
    date: "2023-07-02",
    title: "X-Ray: Left Arm",
    doctor: "Dr. Jones",
  },
  {
    id: "rec4",
    date: "2023-05-21",
    title: "Prescription Refill",
    doctor: "Dr. Smith",
  },
];

export default function RecordsScreen() {
  const { styles, colors } = useTheme();

  const componentStyles = StyleSheet.create({
    cardContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateText: {
      color: colors.primary,
      fontWeight: "bold",
    },
  });

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Medical Records</Text>
      <FlatList
        data={DUMMY_RECORDS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { marginBottom: 12 }]}>
            <View style={componentStyles.cardContent}>
              <View>
                <Text style={styles.text}>{item.title}</Text>
                <Text style={styles.mutedText}>Provider: {item.doctor}</Text>
              </View>
              <Text style={componentStyles.dateText}>{item.date}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
