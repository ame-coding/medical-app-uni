// app/(admin_tabs)/dashboard.tsx
import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import AppButton from "../../components/appButton";

export default function Dashboard() {
  const { styles, sizes, colors } = useTheme();

  const stats = [
    { label: "Total Users", value: 1240 },
    { label: "Total Records", value: 5420 },
    { label: "Active Reminders", value: 80 },
    { label: "Pending Requests", value: 25 },
  ];

  const recentActivities = [
    "User JohnDoe created a new record",
    "Reminder for JaneDoe triggered",
    "New settings updated by Admin",
    "Record #1234 edited",
    "User Mike added a reminder",
  ];

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.heading}>Admin Dashboard</Text>
      <Text style={styles.mutedText}>Overview & quick actions</Text>

      {/* Stats cards */}
      <View style={{ marginTop: sizes.gap }}>
        {stats.map((s) => (
          <View
            key={s.label}
            style={[styles.card, { marginBottom: sizes.gap }]}
          >
            <Text style={styles.text}>{s.label}</Text>
            <Text style={[styles.text, { fontWeight: "700",fontSize: 22 }]}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Quick action button */}
      <AppButton title="View Full Reports" onPress={() => {}} />

      {/* Recent activities */}
      <Text style={[styles.heading, { marginTop: sizes.gap * 2 }]}>
        Recent Activities
      </Text>
      {recentActivities.map((act, i) => (
        <View key={i} style={[styles.card, { marginBottom: sizes.gap }]}>
          <Text style={styles.text}>{act}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
