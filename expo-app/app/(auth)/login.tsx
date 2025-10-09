import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";

const BASE = "http://192.168.1.100:4000";

export default function LoginScreen() {
  const [quote, setQuote] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BASE}/quote`, { credentials: "include" });
        const j = await r.json();
        setQuote(j.quote);
      } catch {}
    })();
  }, []);

  const onLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        Alert.alert("Login failed", j.message || "Invalid credentials");
        return;
      }

      // session cookie is set; navigate to tabs
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Network error", "Could not reach server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {!!quote && <Text style={styles.quote}>"{quote}"</Text>}
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
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 10,
    padding: 12, marginBottom: 12
  }
});
