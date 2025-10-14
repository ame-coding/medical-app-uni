// hooks/useTheme.ts
import { useColorScheme } from "react-native";
import { globalStyles } from "../styles/global";
import { COLORS, SIZES, FONTS } from "../styles/theme";

export const useTheme = () => {
  // const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const scheme: "light" | "dark" = "light"; // FORCE light mode by default

  return {
    colors: COLORS[scheme],
    sizes: SIZES,
    fonts: FONTS,
    styles: globalStyles(scheme),
    mode: scheme,
  };
};
