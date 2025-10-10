import { View, Text, Button, Alert } from "react-native";
import React from "react";
import { router } from "expo-router";

const BASE = "http://192.168.1.100:4000";

export default function Home() {
  const [name, setName] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${BASE}/me`, { credentials: "include" });
        if (r.ok) {
          const data = await r.json();
          if (mounted) {
            setName(data?.user?.username ?? null);
            setRole(data?.user?.role ?? null);
          }
        } else {
          if (mounted) router.replace("/(auth)/login");
        }
      } catch {
        if (mounted) Alert.alert("Error", "Cannot reach server");
      }
    })();
    return () => { mounted = false; };
  }, []);

  const logout = async () => {
    try { await fetch(`${BASE}/logout`, { method: "POST", credentials: "include" }); } catch {}
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", gap:12, padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 8 }}>{name ? `Hello ${name}!` : "Hello!"}</Text>
      <Text style={{ opacity: 0.7 }}>{role ? `You are ${role}` : ""}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
