// MediSphere/app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { ThemeProvider } from "../hooks/useTheme";
import { StatusBar } from "react-native";
import KittyFloating from "../components/kitty/kittyFloating"; // <- match filename case

// Small wrapper that uses the Auth context (must be inside AuthProvider)
function AuthKitty() {
  const { user } = useAuth();
  // Only render KittyFloating for authenticated regular users
  if (!user || user.role?.toLowerCase() !== "user") return null;
  return <KittyFloating />;
}

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

        {/* Kitty only mounts after auth; wrapper calls useAuth safely */}
        <AuthKitty />
      </AuthProvider>
    </ThemeProvider>
  );
}
