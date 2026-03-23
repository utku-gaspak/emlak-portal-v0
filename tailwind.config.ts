import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8eb",
          100: "#fef0c7",
          500: "#d97706",
          700: "#b45309",
          900: "#78350f"
        }
      }
    }
  },
  plugins: []
};

export default config;
