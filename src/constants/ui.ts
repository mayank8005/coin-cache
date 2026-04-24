export const MOTION = {
  fast: 120,
  med: 160,
  slow: 180,
  easing: "cubic-bezier(0.3, 0.7, 0.4, 1)",
} as const;

export const RADII = {
  sm: 4,
  default: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const SPACING = [2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48] as const;

export const MOBILE_FRAME = {
  width: 390,
  height: 844,
  radius: 48,
} as const;

export const BREAKPOINTS = {
  mobile: 640,
  desktop: 1024,
} as const;
