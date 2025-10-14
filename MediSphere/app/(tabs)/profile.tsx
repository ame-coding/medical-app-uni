import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../providers/AuthProvider";

export default function ProfileScreen() {
  const { styles, colors } = useTheme();
  const { user, logout } = useAuth();

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
      <View style={componentStyles.profileCard}>
        <Text style={componentStyles.username}>
          {user?.username ?? "Guest"}
        </Text>
        {user?.role && (
          <View style={componentStyles.roleBadge}>
            <Text style={componentStyles.roleText}>{user.role}</Text>
          </View>
        )}
      </View>

      <View style={componentStyles.buttonContainer}>
        <Button title="Logout" onPress={logout} color={colors.error} />
      </View>
    </View>
  );
}
