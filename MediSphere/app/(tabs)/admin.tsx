import React from "react";
import { View, Text } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";

export default function AdminScreen() {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  if (user?.role !== "admin") return <Redirect href="/(tabs)" />;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>Admin controls go here</Text>
    </View>
  );
}
