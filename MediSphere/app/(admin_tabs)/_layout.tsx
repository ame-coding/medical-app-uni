// app/(admin_tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { StyleSheet, View,StatusBar, Text } from "react-native";
import DarkLightButton from "../../components/darklight";

import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";

export default function AdminTabsLayout() {
  const { barStyle,colors,styles } = useTheme();


   useEffect(() => {
  NavigationBar.setButtonStyleAsync(
    barStyle === "dark-content" ? "dark" : "light"
  );
}, [barStyle]);


  const TabIcon = ({
    name,
    size = 24,
  }: {
    name: React.ComponentProps<typeof MaterialIcons>["name"];
    size?: number;
  }) => <MaterialIcons name={name} size={size} color={colors.primaryVariant} />;

  return (
    <>
            <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
    <Tabs
      screenOptions={{
         headerRight: () => <DarkLightButton />,
        tabBarActiveTintColor: colors.primaryVariant,
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: true,
        tabBarStyle: { backgroundColor: colors.background},
        headerStyle: styles.genback,
        headerTintColor: colors.text,
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
       </>
  );
}
