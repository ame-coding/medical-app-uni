// app/index.tsx
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../providers/AuthProvider";

export default function AppEntry() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (loading) return;

    if (user) {
      const role = user.role?.toLowerCase();
      if (role === "admin") router.replace("/(admin_tabs)/dashboard");
      else router.replace("/(tabs)/home");
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
