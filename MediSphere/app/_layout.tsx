import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";
import { ThemeProvider } from "../hooks/useTheme";
export default function RootLayout() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth routes */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Tabs for normal and admin (admin check happens inside auth flow) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin_tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
    </ThemeProvider>
  );
}
