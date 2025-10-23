import React from "react";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View,StatusBar } from "react-native";

import DarkLightButton from "../../components/darklight";

import { useTheme } from "../../hooks/useTheme";
import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
export default function AuthLayout() {
  const { barStyle,colors,styles } = useTheme();

   
   useEffect(() => {
  NavigationBar.setButtonStyleAsync(
    barStyle === "dark-content" ? "dark" : "light"
  );
}, [barStyle]);


  return (
  
            
    <SafeAreaView style={[styles.genback, { flex: 1}]} edges={["bottom"]}>
      <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen
            name="login"
            options={{
    headerShown: true,
    headerBackVisible: false,
    title: "Login",
    headerRight: () => <DarkLightButton />,
    headerStyle: styles.genback,
    headerTitleStyle: styles.text, 
    contentStyle: styles.genback, 
  }}

          />
          <Stack.Screen
            name="register"
              options={{
    headerShown: true,
    title: "Register",
    headerRight: () => <DarkLightButton />,
    headerStyle: styles.genback,
    headerTitleStyle: styles.text,
    contentStyle: styles.genback,
    headerTintColor: colors.text,
   
  }}
          />
        </Stack>
      </View>
    </SafeAreaView>
     
  );
}
