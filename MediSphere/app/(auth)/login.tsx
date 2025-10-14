// app/(auth)/login.tsx
import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import BASE_URL from "../../lib/apiconfig";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onLoginPress = async () => {
    if (!username || !password) {
      return Alert.alert("Missing", "Enter username and password");
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      console.log("[Login] response:", data, "status:", res.status);

      if (!res.ok) {
        return Alert.alert(
          "Login failed",
          data?.message || "Invalid credentials"
        );
      }

      // Get token from backend response
      const token = data.token ?? data.accessToken ?? data.jwt;
      if (!token) {
        console.error("[Login] token missing in response:", data);
        return Alert.alert(
          "Login failed",
          "Token missing from server response"
        );
      }

      // Save token & refresh provider
      await login(token);

      // Redirect based on role
      const userRole = data.user?.role?.toLowerCase(); // assumes backend returns role
      if (userRole === "admin") {
        router.replace("/(admin_tabs)/dashboard"); // admin landing
      } else {
        router.replace("/(tabs)/home"); // normal user landing
      }
    } catch (err) {
      console.error("[Login] network error:", err);
      Alert.alert("Network error", "Could not reach server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={submitting ? "Logging in..." : "Login"}
        onPress={onLoginPress}
        disabled={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
});
