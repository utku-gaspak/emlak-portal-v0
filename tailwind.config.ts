import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4faf8",
          100: "#e5f4ee",
          500: "#0a7c66",
          700: "#0c5a4c",
          900: "#083a32"
        }
      }
    }
  },
  plugins: []
};

export default config;
