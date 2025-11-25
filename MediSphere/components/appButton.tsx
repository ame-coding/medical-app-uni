// MediSphere/components/appButton.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  View,
  ActivityIndicator,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { useTheme } from "../hooks/useTheme";

type Props = TouchableOpacityProps & {
  title: string;
  variant?: "primary" | "outline";
  loading?: boolean;
  bgColor?: string;
  textColor?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * AppButton
 * - preserves the small margin between buttons so they don't stick together
 * - supports bgColor / textColor overrides
 * - supports containerStyle and textStyle overrides
 * - keeps accessibility and activeOpacity
 */
export default function AppButton({
  title,
  variant = "primary",
  loading = false,
  bgColor,
  textColor,
  textStyle,
  containerStyle,
  style, // keep compatibility with calls that pass `style`
  ...rest
}: Props) {
  const { styles, colors } = useTheme();

  // base styles from theme (primary / outline)
  const baseContainer =
    variant === "primary" ? styles.button : styles.outlineButton;
  const baseText =
    variant === "primary" ? styles.buttonText : styles.outlineButtonText;

  // final colors: allow explicit overrides; otherwise use theme defaults
  const finalBg = bgColor
    ? bgColor
    : variant === "primary"
    ? colors.primary
    : "transparent";
  const finalTextColor = textColor
    ? textColor
    : variant === "primary"
    ? "#fff"
    : colors.primary;

  // merged container preserves little margin between buttons (so they aren't sticky)
  const mergedContainer: any = [
    baseContainer,
    { backgroundColor: finalBg, opacity: loading ? 0.85 : 1 },
    containerStyle,
    style,
    // keep small gap between buttons by default
    { margin: 3 },
  ];

  const mergedText: any = [baseText, { color: finalTextColor }, textStyle];

  return (
    <TouchableOpacity
      {...rest}
      style={mergedContainer}
      disabled={loading || (rest as any).disabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ActivityIndicator
            size="small"
            // spinner color contrasts with button text
            color={finalTextColor || colors.background}
          />
          <View style={{ width: 8 }} />
          <Text style={mergedText}>{title}</Text>
        </View>
      ) : (
        <Text style={mergedText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
