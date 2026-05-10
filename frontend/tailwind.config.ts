import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        surface: "#030712",
        panel: "#0c1222",
        border: "rgba(148, 163, 184, 0.12)",
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(56, 189, 248, 0.25)",
        "glow-lg": "0 0 80px -8px rgba(56, 189, 248, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      },
      keyframes: {
        "cta-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(56, 189, 248, 0.35), 0 10px 40px -10px rgba(0,0,0,0.4)" },
          "50%": { boxShadow: "0 0 28px 2px rgba(56, 189, 248, 0.2), 0 10px 40px -10px rgba(0,0,0,0.4)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "cta-glow": "cta-glow 3s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
