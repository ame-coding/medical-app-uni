import React from "react";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import DarkLightButton from "../../components/darklight";
export default function AuthLayout() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.container}>
        <Stack>
          <Stack.Screen
            name="login"
            options={{   headerShown: true, headerBackVisible: false, title: "Login", headerRight: () => <DarkLightButton />, }}

          />
          <Stack.Screen
            name="register"
            options={{   headerShown: true, title: "Register" , headerRight: () => <DarkLightButton />}}
          />
        </Stack>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // match your auth background color
  },
  container: {
    flex: 1,
  },
});
