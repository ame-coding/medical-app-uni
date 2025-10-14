import React from "react";
import { View, Text, Button } from "react-native";
// CHANGED: We now import useAuth from the correct provider
import { useAuth } from "../../providers/AuthProvider";

/**
 * The home screen, displayed after a successful login.
 */
export default function Home() {
  // CHANGED: useUser has been replaced with useAuth
  const { user, logout } = useAuth();

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
        {/* The user object is now correctly read from the main auth context */}
        {user ? `Hello, ${user.username}!` : "Hello!"}
      </Text>
      <Text style={{ fontSize: 16, color: "gray", marginBottom: 20 }}>
        {user?.role ? `Your role is: ${user.role}` : "Not logged in"}
      </Text>
      <Button title="Logout" onPress={logout} color={"#ff3b30"} />
    </View>
  );
}
