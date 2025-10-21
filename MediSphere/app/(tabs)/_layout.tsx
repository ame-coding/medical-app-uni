import React from "react";

import { StyleSheet, View,StatusBar, Text } from "react-native";
import { Tabs } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import DarkLightButton from "../../components/darklight";

import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";

export default function TabsLayout() {
  const { user, loading } = useAuth();
 const { barStyle,colors,styles } = useTheme();


     useEffect(() => {
    NavigationBar.setButtonStyleAsync(
      barStyle === "dark-content" ? "dark" : "light"
    );
  }, [barStyle]);
  


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
    </>
  );
}
