import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { saveToken, clearToken } from "../../lib/auth";
import { useAuth } from "../../providers/AuthProvider";

const BASE = "http://192.168.1.100:4000";

export default function LoginScreen() {
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BASE}/quote`);
        const data = await r.json();
        setQuote(data?.quote ?? null);
      } catch {}
    })();
  }, []);

  const onLogin = async () => {
    if (!username || !password) return Alert.alert("Missing", "Enter username and password");
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.token) {
        return Alert.alert("Login failed", data?.message || "Invalid username/password");
      }

      // HARD RESET then set the new token to prevent stale admin tokens
      await clearToken();
      await saveToken(data.token);
      await refresh();              // ensure context now has correct {username, role}
      router.replace("/(tabs)");    // then navigate
    } catch {
      Alert.alert("Network error", "Could not reach server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {quote ? <Text style={styles.quote}>"{quote}"</Text> : null}
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
      <Button title={submitting ? "Logging in..." : "Login"} onPress={onLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  quote: { textAlign: "center", fontStyle: "italic", marginBottom: 32, fontSize: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 12 }
});
