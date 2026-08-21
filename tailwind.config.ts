import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        card: "var(--color-card)",
        ink: "var(--color-ink)",
        body: "var(--color-body)",
        muted: "var(--color-muted)",
        subtle: "var(--color-subtle)",
        "brand-dark": "#130E29",
        purple: {
          DEFAULT: "#7C5CFF",
          dark: "#5B3EE8",
        },
        lime: "#C6FF3D",
        pink: "#FF7AC6",
        sky: "#6FD3FF",
        peach: "#FFB86B",
      },
      fontFamily: {
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        "pop-sm": "3px 3px 0 #1A1440",
        pop: "4px 4px 0 #1A1440",
        "pop-lg": "6px 6px 0 #1A1440",
        "pop-xl": "8px 8px 0 #1A1440",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee 22s linear infinite",
        pop: "pop 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
