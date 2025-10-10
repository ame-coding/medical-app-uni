import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";

const BASE = "http://192.168.1.100:4000";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BASE}/quote`, { credentials: "include" });
        const data = await r.json();
        setQuote(data?.quote ?? null);
      } catch {}
    })();
  }, []);

  const onLogin = async () => {
    if (!username || !password) {
      return Alert.alert("Missing", "Enter username and password");
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        return Alert.alert("Login failed", data?.message || "Invalid credentials");
      }
      router.replace("/(tabs)");
    } catch (e) {
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
