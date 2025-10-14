// app/index.tsx
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../providers/AuthProvider";

/**
 * AppEntry - decides where to send the user:
 * - while loading: show spinner
 * - if user exists: go to (tabs)/home
 * - otherwise: go to (auth)/login
 */
export default function AppEntry() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    // Wait for initial auth check to finish
    if (loading) return;

    // Navigate once based on user state
    if (user) {
      router.replace("/(tabs)/home");
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
