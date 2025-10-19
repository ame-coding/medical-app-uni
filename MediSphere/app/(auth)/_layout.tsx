import React from "react";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";

export default function AuthLayout() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.container}>
        <Stack>
          <Stack.Screen
            name="login"
            options={{ headerBackVisible: false, title: "Login" }}
          />
          <Stack.Screen
            name="register"
            options={{ title: "Register" }}
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
