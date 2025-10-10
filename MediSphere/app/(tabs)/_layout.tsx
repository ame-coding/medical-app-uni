import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";

const BASE = "http://192.168.1.100:4000";

export default function TabLayout() {
  const [role, setRole] = React.useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${BASE}/me`, { credentials: "include" });
        if (!r.ok) {
          // redirect to login if not logged in
          // This simplistic redirect may be adapted to your router setup
          return;
        }
        const data = await r.json();
        if (mounted) setRole(data?.user?.role ?? "user");
      } catch {
        if (mounted) setRole("user");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Text style={{ marginTop: 60, textAlign: "center" }}>Loading...</Text>;

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      {role === "admin" ? (
        <Tabs.Screen name="admin" options={{ title: "Admin" }} />
      ) : null}
    </Tabs>
  );
}
