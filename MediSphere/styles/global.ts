// styles/global.ts
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "./theme";

export const globalStyles = (mode: "light" | "dark" = "light") =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: COLORS[mode].background,
      padding: SIZES.padding,
      borderWidth: 5, // <-- ADD THIS
      borderColor: "red", // <-- AND THIS
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    centerPadded: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SIZES.padding,
      gap: SIZES.gap,
    },
    heading: {
      fontSize: SIZES.h1,
      color: COLORS[mode].text,
      fontWeight: "600",
      marginBottom: SIZES.gap,
    },
    text: {
      fontSize: SIZES.body,
      color: COLORS[mode].text,
    },
    mutedText: {
      fontSize: SIZES.body,
      color: COLORS[mode].muted,
    },
    button: {
      backgroundColor: COLORS[mode].primary,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: SIZES.radius,
      minWidth: 140,
      alignItems: "center",
    },
    buttonText: {
      color: "#fff",
      fontSize: SIZES.body,
      textAlign: "center",
      fontWeight: "600",
    },
    card: {
      backgroundColor: COLORS[mode].surface,
      padding: SIZES.padding,
      borderRadius: SIZES.radius,
    },
  });
