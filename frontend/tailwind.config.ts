import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0b1020",
        panel: "#111931",
        border: "#233152",
      },
    },
  },
  plugins: [],
};

export default config;
