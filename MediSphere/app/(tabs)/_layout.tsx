import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "../../providers/AuthProvider";

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Text style={{ marginTop: 60, textAlign: "center" }}>Loading...</Text>;
  }

  const isAdmin = user?.role === "admin";

  return (
    <Tabs key={`role-${isAdmin ? "admin" : "user-or-none"}`}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? "/(tabs)/admin" : null, // hides the tab when not admin
        }}
      />
    </Tabs>
  );
}
