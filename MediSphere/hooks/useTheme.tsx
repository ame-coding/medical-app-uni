// hooks/useTheme.ts
import React, { createContext, useContext, useState, useMemo } from "react";
import { useColorScheme } from "react-native";
import { globalStyles } from "../styles/global";
import { COLORS, SIZES, FONTS } from "../styles/theme";

type ThemeMode = "light" | "dark";

type ThemeContextType = {
  mode: ThemeMode;
  colors: typeof COLORS.light;
  sizes: typeof SIZES;
  fonts: typeof FONTS;
  styles: ReturnType<typeof globalStyles>;
  toggleTheme: () => void;
};

// Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = (useColorScheme() ?? "light") as ThemeMode;
  const [mode, setMode] = useState<ThemeMode>(systemScheme);

  const toggleTheme = () => setMode((prev) => (prev === "light" ? "dark" : "light"));

  const value = useMemo(
    () => ({
      mode,
      colors: COLORS[mode],
      sizes: SIZES,
      fonts: FONTS,
      styles: globalStyles(mode),
      toggleTheme,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hook — backward compatible with your existing usage
export const useTheme = () => {
  const context = useContext(ThemeContext);

  // fallback: if not wrapped in provider, return default light mode (old behavior)
  if (!context) {
    const scheme: ThemeMode = "light";
    return {
      colors: COLORS[scheme],
      sizes: SIZES,
      fonts: FONTS,
      styles: globalStyles(scheme),
      mode: scheme,
      toggleTheme: () => {},
    };
  }

  return context;
};
