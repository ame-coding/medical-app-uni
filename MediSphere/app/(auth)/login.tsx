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
import { Pressable, Text } from "react-native";
import { useTheme } from "../../hooks/useTheme";
export default function LoginScreen() {
  const { styles, colors } = useTheme();
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
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { justifyContent: "center", padding: 20}]}>

       <Text style={[styles.heading, {  textAlign: "center",
        paddingBottom: 20}]}>MEDISPHERE</Text>
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
      <View style={{ marginBottom: 4 }}>
          <Button title="Login" onPress={onLoginPress} disabled={submitting} />
          
      </View>
      <Button title="Register" onPress={registration}/>
      
    </View>
  );
}
