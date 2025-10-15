// app/(admin_tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

export default function AdminTabsLayout() {
  const { colors } = useTheme();

  const TabIcon = ({
    name,
    size = 24,
  }: {
    name: React.ComponentProps<typeof MaterialIcons>["name"];
    size?: number;
  }) => <MaterialIcons name={name} size={size} color={colors.primaryVariant} />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryVariant,
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: () => <TabIcon name="dashboard" />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: "Records",
          tabBarIcon: () => <TabIcon name="folder" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: () => <TabIcon name="settings" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => <TabIcon name="person" />,
        }}
      />
    </Tabs>
  );
}
