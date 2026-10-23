export const COLORS = {
  green: {
    50: "#f0f9f4",
    100: "#dcedd4",
    200: "#badec1",
    300: "#89c9a8",
    400: "#5bb28b",
    500: "#30956e",
    600: "#257a5a",
    700: "#1d6248",
    800: "#19513c",
    900: "#123d2d",
    950: "#0a261a",
  },
  neutral: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
  },
  semantic: {
    success: "#15803d",
    warning: "#b45309",
    error: "#b91c1c",
    info: "#155e75",
    surface: "#ffffff",
    surfaceSecondary: "#f4f4f5",
    border: "#e4e4e7",
    text: "#18181b",
    textSecondary: "#52525b",
    textMuted: "#71717a",
    divider: "#e4e4e7",
  },
} as const;

export const TYPOGRAPHY = {
  fontSans: "var(--font-inter), system-ui, sans-serif",
  h1: "text-3xl font-bold tracking-tight text-gray-900",
  h2: "text-2xl font-semibold tracking-tight text-gray-900",
  h3: "text-xl font-semibold tracking-tight text-gray-900",
  body: "text-base text-gray-700",
  bodySm: "text-sm text-gray-600",
  bodyXs: "text-xs text-gray-500",
} as const;

export const SPACING = {
  px: "1px",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const RADIUS = {
  none: "0",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
} as const;

export const SHADOW = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};

export const ZINDEX = {
  dropdown: 1000,
  sticky: 1020,
  modalBackdrop: 1040,
  modal: 1050,
  toast: 1070,
};
