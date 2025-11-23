// MediSphere/styles/kittyStyles.ts
import { StyleSheet } from "react-native";

export const kittyStyles = (mode: "light" | "dark" = "light") =>
  StyleSheet.create({
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: mode === "light" ? "#fff" : "#111",
      borderColor: mode === "light" ? "#E6EEF8" : "#222",
      color: mode === "light" ? "#111" : "#fff",
      flex: 1,
    },
  });
