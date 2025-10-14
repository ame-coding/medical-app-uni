// styles/theme.ts
export const COLORS = {
  light: {
    primary: "#2ECC71", // green
    secondary: "#F1C40F", // yellow
    accent: "#E67E22", // orange
    background: "#FFFFFF",
    surface: "#F8FAFB",
    text: "#111827",
    muted: "#6B7280",

    // Semantic Colors - THE ERROR IS BECAUSE THESE ARE MISSING
    success: "#2ECC71",
    warning: "#F1C40F",
    error: "#E74C3C", // red
    info: "#3498DB", // blue
  },

  dark: {
    primary: "#3498DB", // light blue
    secondary: "#E67E22", // orange
    accent: "#E67E22",
    background: "#000000",
    surface: "#0B0D10",
    text: "#F5F5F5",
    muted: "#9CA3AF",

    // Semantic Colors - THE ERROR IS BECAUSE THESE ARE MISSING
    success: "#2ECC71",
    warning: "#F1C40F",
    error: "#E74C3C",
    info: "#3498DB",
  },
};

export const SIZES = {
  padding: 16,
  gap: 12,
  radius: 10,
  h1: 22,
  h2: 18,
  body: 15,
};

export const FONTS = {
  regular: "System",
  bold: "System",
};
