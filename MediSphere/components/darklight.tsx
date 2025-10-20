import React from "react";
import { TouchableOpacity, Image, StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function DarkLightButton() {
  const { mode, toggleTheme } = useTheme();

  const iconSource =
    mode === "light"
      ? require("../assets/images/dark-icon.png")
      : require("../assets/images/light-icon.png");

  return (
    <TouchableOpacity onPress={toggleTheme} style={styles.button}>
      <Image source={iconSource} style={styles.icon} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { padding: 6, borderRadius: 10 },
  icon: { width: 26, height: 26 },
});
