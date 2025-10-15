import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";
import React from "react";
import { useAuth } from "../providers/AuthProvider";

export default function RootLayout() {
  const { user, loading } = useAuth();

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth stack */}
        <Stack.Screen name="(auth)" />

        {/* Normal user tabs */}
        <Stack.Screen name="(tabs)" />

        {/* Admin tabs: optionally route only for admin */}
        {user?.role?.toLowerCase() === "admin" && (
          <Stack.Screen name="(admin_tabs)" />
        )}
      </Stack>
    </AuthProvider>
  );
}
