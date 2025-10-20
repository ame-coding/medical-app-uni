import React from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import DarkLightButton from "../../components/darklight";

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme(); // get theme colors

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading session...</Text>
      </View>
    );
  }

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
        headerRight: () => <DarkLightButton />,
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: colors.primaryVariant,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: () => <TabIcon name="home" />,
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
        name="reminders"
        options={{
          title: "Reminders",
          tabBarIcon: () => <TabIcon name="alarm" />,
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
