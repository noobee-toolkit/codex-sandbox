export const BREAKPOINTS = [360, 640, 900, 1200, 1536] as const

export const FONT_FAMILIES = {
  body: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  heading: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
}

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 19,
  xl: 24,
  xxl: 30,
}

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.45,
  relaxed: 1.65,
}

export const LETTER_SPACING = {
  tight: -0.015,
  normal: 0,
  wide: 0.02,
}

export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const RADII = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
}

export const SHADOWS = {
  sm: "0 1px 2px rgba(6, 10, 18, 0.35)",
  md: "0 12px 28px rgba(2, 8, 20, 0.35)",
  lg: "0 24px 52px rgba(2, 8, 20, 0.45)",
}

export const ICON_SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 30,
}

export type ColourRoles = {
  background: string
  surface: string
  surface2: string
  border: string
  borderStrong: string
  text: string
  textMuted: string
  accent: string
  accent2: string
  success: string
  warning: string
  danger: string
  focusRing: string
}

export type ThemeDef = {
  colours: ColourRoles
  baseFontSize: number
  headingWeight: number
  bodyWeight: number
}

export const THEMES = {
  default: {
    colours: {
      background: "#0B1220",
      surface: "#121C2D",
      surface2: "#1A263B",
      border: "#2A3A56",
      borderStrong: "#49648F",
      text: "#E9F0FF",
      textMuted: "#A7B6D1",
      accent: "#5B8CFF",
      accent2: "#52D1C8",
      success: "#3DDC97",
      warning: "#F4B942",
      danger: "#FF6C7A",
      focusRing: "#7EB1FF",
    },
    baseFontSize: 16,
    headingWeight: 700,
    bodyWeight: 500,
  },
  highContrast: {
    colours: {
      background: "#000000",
      surface: "#0B0B0B",
      surface2: "#1A1A1A",
      border: "#5E5E5E",
      borderStrong: "#FFFFFF",
      text: "#FFFFFF",
      textMuted: "#E1E1E1",
      accent: "#5FC8FF",
      accent2: "#FFE25C",
      success: "#7DFFA8",
      warning: "#FFD166",
      danger: "#FF7F93",
      focusRing: "#FFFFFF",
    },
    baseFontSize: 17,
    headingWeight: 800,
    bodyWeight: 600,
  },
  calmWarm: {
    colours: {
      background: "#1B1511",
      surface: "#26201B",
      surface2: "#322920",
      border: "#4B3C30",
      borderStrong: "#80674F",
      text: "#F5EBDD",
      textMuted: "#C7B39C",
      accent: "#D18F4B",
      accent2: "#B89E6B",
      success: "#8FCB8F",
      warning: "#E8B86A",
      danger: "#E3867A",
      focusRing: "#F0C689",
    },
    baseFontSize: 16,
    headingWeight: 700,
    bodyWeight: 500,
  },
} as const

export type OrgThemeId = keyof typeof THEMES
