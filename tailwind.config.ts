import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        // color-mix + <alpha-value> : rend les modificateurs d'opacité
        // (bg-background/85, text-foreground/80…) fonctionnels avec des
        // tokens hex pilotés par l'admin (SiteThemeStyle).
        background:
          "color-mix(in srgb, var(--background) calc(<alpha-value> * 100%), transparent)",
        foreground:
          "color-mix(in srgb, var(--foreground) calc(<alpha-value> * 100%), transparent)",
        muted:
          "color-mix(in srgb, var(--muted) calc(<alpha-value> * 100%), transparent)",
        surface:
          "color-mix(in srgb, var(--surface) calc(<alpha-value> * 100%), transparent)",
        "surface-dark":
          "color-mix(in srgb, var(--surface-dark) calc(<alpha-value> * 100%), transparent)",
        primary:
          "color-mix(in srgb, var(--primary) calc(<alpha-value> * 100%), transparent)",
        "accent-blue":
          "color-mix(in srgb, var(--accent-blue) calc(<alpha-value> * 100%), transparent)",
        "accent-orange":
          "color-mix(in srgb, var(--accent-orange) calc(<alpha-value> * 100%), transparent)",
        "accent-silver":
          "color-mix(in srgb, var(--accent-silver) calc(<alpha-value> * 100%), transparent)",
        border:
          "color-mix(in srgb, var(--border) calc(<alpha-value> * 100%), transparent)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 7vw, 6.5rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.25rem, 5vw, 4.5rem)", { lineHeight: "1", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(1.75rem, 3.5vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-2%, 1%)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,17,17,0.04), 0 8px 24px rgba(17,17,17,0.06)",
        "card-hover": "0 2px 4px rgba(17,17,17,0.06), 0 16px 48px rgba(17,17,17,0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
