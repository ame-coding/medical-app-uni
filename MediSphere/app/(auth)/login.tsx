// app/(auth)/login.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
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
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return Alert.alert(
          "Login failed",
          data?.message || "Invalid credentials"
        );
      }

      const token = data.token;
      if (!token) {
        return Alert.alert("Login failed", "Token missing in response");
      }

      await login(token);

      const role = data.user?.role?.toLowerCase() ?? "user";
      if (role === "admin") router.replace("/(admin_tabs)/dashboard");
      else router.replace("/(tabs)/home");
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert("Error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
      <Button title="Login" onPress={onLoginPress} disabled={submitting} />
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
