import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../providers/AuthProvider";

export default function AppEntry() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // wait until auth ready

    if (user) {
      const role = user.role?.toLowerCase();
      router.replace(
        role === "admin" ? "/(admin_tabs)/dashboard" : "/(tabs)/home"
      );
    } else {
      router.replace("/(auth)/login");
    }
  }, [user, loading, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
