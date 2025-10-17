// app/(tabs)/home.tsx
import React from "react";
import { View, Text, FlatList, Alert } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";
import AppButton from "@/components/appButton";

export default function Home() {
  const { styles, colors, sizes } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading)
    return (
      <View style={styles.screen}>
        <Text style={styles.mutedText}>Loading...</Text>
      </View>
    );
  if (!user) {
    router.replace("/(auth)/login");
    return null;
  }

  const quickActions = [
    { id: "a1", label: "New Record", hint: "Add a new medical record" },
    { id: "a2", label: "Add Reminder", hint: "Create a medication alarm" },
    { id: "a3", label: "Find Clinic", hint: "Search nearby clinics" },
  ];

  return (
    <View style={styles.screen}>
      <View style={[styles.card, { marginBottom: sizes.gap }]}>
        <Text style={styles.heading}>
          Welcome{user ? `, ${user.username}` : "!"}
        </Text>
        <Text style={styles.mutedText}>Overview of your health workspace.</Text>
      </View>

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
                    title={item.id === "a1" ? "Open" : "Open"}
                    onPress={() =>
                      item.id === "a1"
                        ? router.push("../addItems/newRecord") // updated path
                        : Alert.alert("Action", item.label)
                    }
                  />
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}
