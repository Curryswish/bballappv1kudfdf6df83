import type { Config } from "tailwindcss";

// RunIt design tokens — inspired by hardwood courts + scoreboards.
// Palette: hardwood amber (primary/action), court-line chalk (surfaces),
// scoreboard charcoal (dark/text), net-white, and a made-shot green / live-red
// for status states. Avoids the generic cream+terracotta AI-default palette.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        hardwood: {
          50: "#FFF7ED",
          100: "#FFE9CF",
          400: "#F2994A",
          500: "#E8752C", // primary action color — hardwood/amber
          600: "#C85D1B",
          700: "#9C4715",
        },
        court: {
          25: "#FAFAF7", // page background — chalk
          50: "#F3F2EC",
          100: "#E7E4D9",
          900: "#1B1B1F", // scoreboard charcoal — headings/nav
        },
        rim: {
          green: "#1E7A4C", // made shot / open / success
          red: "#C93B3B", // live / full / error
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,27,31,0.04), 0 8px 24px -12px rgba(27,27,31,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
