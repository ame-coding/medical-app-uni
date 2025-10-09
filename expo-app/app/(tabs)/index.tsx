import { View, Text, Button, Alert } from "react-native";
import { router } from "expo-router";

const BASE = "http://192.168.1.100:4000";

export default function Home() {
  const logout = async () => {
    try {
      await fetch(`${BASE}/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch {
      Alert.alert("Warning", "Server unreachable; clearing session locally.");
    } finally {
      router.replace("/(auth)/login");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
      <Text>Welcome to the homepage!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
