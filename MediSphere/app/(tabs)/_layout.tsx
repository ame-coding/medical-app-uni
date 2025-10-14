// app/(tabs)/_layout.tsx
import React from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";

function InnerTabs() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading session...</Text>
      </View>
    );
  }

  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="records" options={{ title: "Records" }} />
      <Tabs.Screen name="reminders" options={{ title: "Reminders" }} />
      {user?.role === "admin" && (
        <Tabs.Screen name="admin" options={{ title: "Admin" }} />
      )}
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return <InnerTabs />;
}
