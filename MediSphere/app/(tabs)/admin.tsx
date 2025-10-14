import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export default function AdminScreen() {
  const { styles } = useTheme();

  return (
    <View style={styles.centerPadded}>
      <Text style={styles.heading}>Admin Panel</Text>
      <Text style={styles.text}>
        This area is restricted to administrators.
      </Text>
      <Text style={styles.mutedText}>
        Place your admin controls and dashboards here.
      </Text>
    </View>
  );
}
