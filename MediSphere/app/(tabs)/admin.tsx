import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../providers/AuthProvider";
import { useRouter } from "expo-router";
import AppButton from "@/components/appButton";

export default function AdminScreen() {
  const { styles, sizes } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not admin and not loading, redirect to home
    if (!loading && user?.role?.toLowerCase() !== "admin") {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, router]);

  // While loading or user is not admin, render nothing
  if (loading || user?.role?.toLowerCase() !== "admin") return null;

  // assume auth guard already redirects non-admins
  const stats = [
    { label: "Total Users", value: 1240 },
    { label: "Records", value: 5420 },
    { label: "Active Reminders", value: 80 },
  ];

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Admin Panel</Text>
      <Text style={styles.mutedText}>Overview & quick actions</Text>

      <View style={{ marginTop: sizes.gap }}>
        {stats.map((s) => (
          <View
            key={s.label}
            style={[styles.card, { marginBottom: sizes.gap }]}
          >
            <Text style={styles.text}>{s.label}</Text>
            <Text style={{ fontWeight: "700", fontSize: 22 }}>{s.value}</Text>
          </View>
        ))}
      </View>

      <AppButton title="Open Dashboard" onPress={() => {}} />
    </View>
  );
}
