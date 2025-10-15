// app/(admin_tabs)/profile.tsx
import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../providers/AuthProvider";
import AppButton from "../../components/appButton";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { styles, colors } = useTheme();
  const { user, logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login"); // navigate to login after logout
  };
  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Admin Profile</Text>
      <View style={[styles.card, { marginBottom: 16 }]}>
        <Text style={styles.text}>Username: {user?.username}</Text>
        <Text style={styles.text}>Role: {user?.role}</Text>
      </View>

      <AppButton title="Logout" onPress={handleLogout} />
    </View>
  );
}
