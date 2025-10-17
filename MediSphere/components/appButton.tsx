import React from "react";
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  View,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../hooks/useTheme";

type Props = TouchableOpacityProps & {
  title: string;
  variant?: "primary" | "outline";
  loading?: boolean;
  bgColor?: string; // ✅ new: custom background color
  textColor?: string; // ✅ new: custom text color
};

export default function AppButton({
  title,
  variant = "primary",
  loading = false,
  bgColor,
  textColor,
  ...rest
}: Props) {
  const { styles, colors } = useTheme();

  const buttonStyle = [
    variant === "primary" ? styles.button : styles.outlineButton,
    bgColor ? { backgroundColor: bgColor } : {},
    { opacity: loading ? 0.8 : 1 },
  ];

  const textStyle = [
    variant === "primary" ? styles.buttonText : styles.outlineButtonText,
    textColor ? { color: textColor } : {},
  ];

  return (
    <TouchableOpacity style={buttonStyle} disabled={loading} {...rest}>
      {loading ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator size="small" color={colors.background} />
          <Text style={textStyle}>{title}</Text>
        </View>
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
