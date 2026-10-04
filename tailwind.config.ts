import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#285068",
        alert: "#D83038",
        steel: "#C0C8D0",
        paper: "#F8F8F8",
        ink: "#14202B",
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
