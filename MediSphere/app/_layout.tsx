// MediSphere/app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";
import { ThemeProvider } from "../hooks/useTheme";
import { StatusBar } from "react-native";
import KittyFloating from "../components/kitty/kittyFloating";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin_tabs)" options={{ headerShown: false }} />
        </Stack>

        {/* Floating kitty always present (renders above screens) */}
        <KittyFloating />
      </AuthProvider>
    </ThemeProvider>
  );
}
