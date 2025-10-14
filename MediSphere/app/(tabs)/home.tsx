import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { useTheme } from "../../hooks/useTheme";
import { router } from "expo-router";
import AppButton from "@/components/appButton";

export default function Home() {
  const { styles, colors, sizes } = useTheme();
  const { user } = useAuth();

  const quickActions = [
    { id: "a1", label: "New Record", hint: "Add a new medical record" },
    { id: "a2", label: "Add Reminder", hint: "Create a medication alarm" },
    { id: "a3", label: "Find Clinic", hint: "Search nearby clinics" },
  ];

  const tips = [
    {
      id: "t1",
      title: "Stay Hydrated",
      body: "Drink at least 2L water daily.",
    },
    {
      id: "t2",
      title: "Sleep Routine",
      body: "Try to sleep by 11:30 PM for better recovery.",
    },
    {
      id: "t3",
      title: "Stretch Daily",
      body: "5–10 mins of stretching reduces stiffness.",
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={[styles.card, { marginBottom: sizes.gap }]}>
        <Text style={styles.heading}>
          Welcome{user ? `, ${user.username}` : "!"}
        </Text>
        <Text style={styles.mutedText}>Overview of your health workspace.</Text>

        <View style={{ marginTop: sizes.gap }}>
          <Text style={[styles.text, { marginBottom: 8 }]}>Health Score</Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
                86
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.text}>
                You are due for a check-up in 2 months.
              </Text>
              <Text style={styles.mutedText}>
                Use quick actions below to act fast.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.card, { marginBottom: sizes.gap }]}>
        <Text style={styles.heading}>Quick Actions</Text>
        <Text style={styles.mutedText}>
          Common tasks you may need right now
        </Text>

        <FlatList
          data={quickActions}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: sizes.gap }}
          renderItem={({ item }) => (
            <View style={{ marginRight: sizes.gap, width: 160 }}>
              <View style={[styles.card, { padding: 12 }]}>
                <Text style={{ fontWeight: "700" }}>{item.label}</Text>
                <Text style={[styles.mutedText, { marginTop: 6 }]}>
                  {item.hint}
                </Text>
                <View style={{ marginTop: 10 }}>
                  <AppButton
                    title="Open"
                    onPress={() => {
                      /* handle */
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        />
      </View>

      {/* Health Tips */}
      <View style={[styles.card]}>
        <Text style={styles.heading}>Health Tips</Text>
        <Text style={styles.mutedText}>
          Small habits that make a big difference
        </Text>

        <FlatList
          data={tips}
          keyExtractor={(i) => i.id}
          style={{ marginTop: sizes.gap }}
          renderItem={({ item }) => (
            <View style={{ marginBottom: sizes.gap }}>
              <Text style={{ fontWeight: "700" }}>{item.title}</Text>
              <Text style={[styles.text, { marginTop: 6 }]}>{item.body}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}
