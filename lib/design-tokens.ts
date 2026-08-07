/**
 * Design Tokens - ICT Community Forum
 * Centralized styling values for consistency across the application
 */

// ============ COLORS ============
export const colors = {
  // Primary
  primary: {
    DEFAULT: "#7c3aed",
    light: "#a78bfa",
    dark: "#6d28d9",
  },
  // Teal (Study Session)
  teal: {
    DEFAULT: "#14b8a6",
    light: "#a7f3d0",
    dark: "#0d9488",
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#a7f3d0",
  },
  // Status Colors
  success: "#10b981",
  warning: "#fbbf24",
  error: "#ef4444",
  info: "#3b82f6",
  // Neutral
  white: "#ffffff",
  black: "#000000",
} as const;

// ============ SPACING ============
export const spacing = {
  xs: "0.25rem",   // 4px
  sm: "0.5rem",    // 8px
  md: "1rem",      // 16px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
  "2xl": "2.5rem", // 40px
  "3xl": "3rem",   // 48px
} as const;

// ============ TYPOGRAPHY ============
export const typography = {
  // Font families
  fontFamily: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    mono: "'Courier New', monospace",
  },
  // Font sizes
  fontSize: {
    xs: "0.75rem",      // 12px
    sm: "0.875rem",     // 14px
    base: "1rem",       // 16px
    lg: "1.125rem",     // 18px
    xl: "1.25rem",      // 20px
    "2xl": "1.5rem",    // 24px
    "3xl": "1.875rem",  // 30px
  },
  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============ TRANSITIONS & ANIMATIONS ============
export const transitions = {
  // Duration
  duration: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
  // Easing functions
  easing: {
    linear: "linear",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

// ============ SHADOWS ============
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
} as const;

// ============ BORDER RADIUS ============
export const borderRadius = {
  none: "0",
  sm: "0.25rem",    // 4px
  md: "0.5rem",     // 8px
  lg: "0.75rem",    // 12px
  full: "9999px",
} as const;

// ============ Z-INDEX ============
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
} as const;

// ============ BREAKPOINTS ============
export const breakpoints = {
  xs: "0px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ============ COMPONENT PRESETS ============

// Button sizes
export const buttonSizes = {
  xs: { padding: "0.25rem 0.5rem", fontSize: "0.75rem" },
  sm: { padding: "0.5rem 0.75rem", fontSize: "0.875rem" },
  md: { padding: "0.75rem 1rem", fontSize: "1rem" },
  lg: { padding: "1rem 1.5rem", fontSize: "1.125rem" },
  xl: { padding: "1.25rem 2rem", fontSize: "1.25rem" },
} as const;

// Input heights
export const inputHeights = {
  sm: "32px",
  md: "40px",
  lg: "48px",
} as const;

// Focus ring (for accessibility)
export const focusRing = {
  default: "0 0 0 3px rgba(124, 58, 237, 0.1), 0 0 0 2px rgba(124, 58, 237, 1)",
  teal: "0 0 0 3px rgba(20, 184, 166, 0.1), 0 0 0 2px rgba(20, 184, 166, 1)",
  error: "0 0 0 3px rgba(239, 68, 68, 0.1), 0 0 0 2px rgba(239, 68, 68, 1)",
} as const;

// ============ ANIMATION KEYFRAMES ============
export const animations = {
  pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  spin: "spin 1s linear infinite",
  bounce: "bounce 1s infinite",
  fadeIn: "fadeIn 0.3s ease-in-out",
  slideUp: "slideUp 0.3s ease-out",
  slideDown: "slideDown 0.3s ease-out",
  scaleIn: "scaleIn 0.3s ease-out",
} as const;

export default {
  colors,
  spacing,
  typography,
  transitions,
  shadows,
  borderRadius,
  zIndex,
  breakpoints,
  buttonSizes,
  inputHeights,
  focusRing,
  animations,
};
