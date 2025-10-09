import { Stack } from "expo-router";
import { useEffect, useState } from "react";

const BASE = "http://192.168.1.100:4000";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/me`, {
          method: "GET",
          credentials: "include"
        });
        setLoggedIn(res.ok);
      } catch {
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {loggedIn ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
