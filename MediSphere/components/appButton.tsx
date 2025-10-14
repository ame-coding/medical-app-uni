// app/components/AppButton.tsx
import React from "react";
import { TouchableOpacity, Text, useColorScheme } from "react-native";
import { globalStyles } from "../styles/global";

export default function AppButton({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const styles = globalStyles(scheme);

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}
