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
      },
    },
  },
  plugins: [],
};

export default config;
