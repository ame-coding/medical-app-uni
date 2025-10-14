import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../providers/AuthProvider";
import { useRouter } from "expo-router";
import AppButton from "@/components/appButton";

export default function ProfileScreen() {
  const { styles, colors } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login"); // navigate to login after logout
  };

  const componentStyles = StyleSheet.create({
    profileCard: {
      ...styles.card,
      alignItems: "center",
      padding: 24,
      gap: 8,
    },
    username: {
      ...styles.text,
      fontSize: 20,
      fontWeight: "bold",
    },
    roleBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: "hidden",
    },
    roleText: {
      color: "#fff",
      fontWeight: "bold",
      textTransform: "capitalize",
    },
    buttonContainer: {
      marginTop: 24,
    },
  });

  return (
    <View style={styles.centerPadded}>
      <View style={[styles.card, { alignItems: "center", width: "100%" }]}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.glass,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}
          >
            {user?.username?.charAt(0)?.toUpperCase() ?? "G"}
          </Text>
        </View>

        <Text style={[styles.text, { fontWeight: "700", fontSize: 18 }]}>
          {user?.username ?? "Guest"}
        </Text>
        <Text style={styles.mutedText}>{user?.role ?? "No role"}</Text>

        <View style={{ marginTop: 18, width: "100%" }}>
          <AppButton title="Edit Profile" onPress={() => {}} />
        </View>

        <View style={{ marginTop: 12, width: "100%" }}>
          <AppButton title="Logout" variant="outline" onPress={handleLogout} />
        </View>
      </View>
    </View>
  );
}
