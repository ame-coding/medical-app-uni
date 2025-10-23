import React, { useState } from "react";
import { View, TextInput, Alert, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import BASE_URL from "../../lib/apiconfig";
import AppButton from "@/components/appButton";
import { useTheme } from "../../hooks/useTheme";

export default function LoginScreen() {
  const { styles } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const registration = () => {
    router.push("/(auth)/register");
  };

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
      if (!res.ok)
        return Alert.alert(
          "Login failed",
          data?.message || "Invalid credentials"
        );

      const token = data.token;
      if (!token)
        return Alert.alert("Login failed", "Token missing in response");

      // Save token and refresh user state
      await login(token);

      // Redirect immediately after login
      const role = data.user?.role?.toLowerCase() ?? "user";
      router.replace(
        role === "admin" ? "/(admin_tabs)/dashboard" : "/(tabs)/home"
      );

      // --- PUSH TOKEN REGISTRATION REMOVED ---
      // registerExpoPushToken().catch((err) =>
      //   console.warn("Push token registration failed:", err)
      // );
      // --- END REMOVAL ---
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
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { justifyContent: "center", padding: 20 }]}>
      <Text
        style={[styles.heading, { textAlign: "center", paddingBottom: 20 }]}
      >
        MEDISPHERE
      </Text>

      <Text style={[styles.text, { marginBottom: 3, marginTop: 3 }]}>
        Username
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <Text style={[styles.text, { marginBottom: 3, marginTop: 3 }]}>
        Password
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <AppButton title="Login" onPress={onLoginPress} disabled={submitting} />
      <AppButton title="Register" onPress={registration} />
    </View>
  );
}
