import React from "react";
import { View, Text, Button } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import { clearToken } from "../../lib/auth";

export default function Home() {
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    await clearToken();           // double clear for safety
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 8 }}>
        {user?.username ? `Hello ${user.username}!` : "Hello!"}
      </Text>
      <Text style={{ opacity: 0.7 }}>{user?.role ? `You are ${user.role}` : ""}</Text>
      <Button title="Logout" onPress={onLogout} />
    </View>
  );
}
