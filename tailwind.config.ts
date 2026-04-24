import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        line: "var(--line)",
        "line-strong": "var(--lineStrong)",
        fg: "var(--fg)",
        "fg-muted": "var(--fgMuted)",
        "fg-dim": "var(--fgDim)",
        accent: "var(--accent)",
        "accent-ink": "var(--accentInk)",
        pos: "var(--pos)",
        neg: "var(--neg)",
        "ai-tint": "var(--aiTint)",
        "ai-line": "var(--aiLine)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        pill: "999px",
      },
      transitionTimingFunction: {
        chip: "cubic-bezier(0.3, 0.7, 0.4, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        med: "160ms",
        slow: "180ms",
      },
    },
  },
  plugins: [],
};

export default config;
