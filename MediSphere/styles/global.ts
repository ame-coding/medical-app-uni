import { StyleSheet, StatusBar, Platform } from "react-native";
import { COLORS, SIZES } from "./theme";

export const globalStyles = (mode: "light" | "dark" = "light") =>
  StyleSheet.create({
    // Screen wrappers
    screen: {
      flex: 1,
      backgroundColor: COLORS[mode].background,
      padding: SIZES.padding,
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
      backgroundColor: COLORS[mode].background,
    },

    // Typography
    heading: {
      fontSize: SIZES.h2,
      color: COLORS[mode].text,
      fontWeight: "700",
      marginBottom: SIZES.gap,
    },

    text: {
      fontSize: SIZES.body,
      color: COLORS[mode].text,
      lineHeight: SIZES.body * 1.5,
    },

    mutedText: {
      fontSize: SIZES.caption,
      color: COLORS[mode].muted,
    },

    // Elevated card with subtle shadow/border
    card: {
      backgroundColor: COLORS[mode].surface,
      padding: SIZES.gap,
      borderRadius: SIZES.radius,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 5,
      borderWidth: 1,
      borderColor: COLORS[mode].border,
    },
    // Example for use in your theme/styles hook
    input: {
    borderWidth: 1,
    borderColor: COLORS[mode].border,
    borderRadius: SIZES.radius, 
    paddingVertical: 10,
    paddingHorizontal: SIZES.padding, 
    marginBottom: SIZES.gap,
    fontSize: SIZES.body, 
     color: COLORS[mode].text,
      backgroundColor: COLORS[mode].surface, 
    
     
    },

    // Buttons (primary & outline)
    button: {
      backgroundColor: COLORS[mode].primary,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: SIZES.radius,
      minWidth: 140,
      alignItems: "center",
      justifyContent: "center",
      height: SIZES.touchable,
      shadowColor: COLORS[mode].primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 3,
    },

    buttonText: {
      color: "#fff",
      fontSize: SIZES.body,
      textAlign: "center",
      fontWeight: "700",
    },

    outlineButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: COLORS[mode].primary,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: SIZES.radius,
      minWidth: 140,
      alignItems: "center",
      justifyContent: "center",
      height: SIZES.touchable,
    },

    outlineButtonText: {
      color: COLORS[mode].primary,
      fontSize: SIZES.body,
      textAlign: "center",
      fontWeight: "700",
    },

    // Utility
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    spaced: { marginVertical: SIZES.gap },
  
    //header
    header: {
      backgroundColor: COLORS[mode].background,
      borderBottomColor: COLORS[mode].border,
    },


    //generalbackground
    genback: {
      backgroundColor: COLORS[mode].background,
    },
  
  });
