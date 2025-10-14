import React from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading session...</Text>
      </View>
    );
  }

  const isAdmin = (user?.role ?? "user").toLowerCase() === "admin";

  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="records" options={{ title: "Records" }} />
      <Tabs.Screen name="reminders" options={{ title: "Reminders" }} />

      {/* Conditionally hide the admin tab using href: null */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? "/admin" : null, // This line hides/shows the tab
        }}
      />

      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
