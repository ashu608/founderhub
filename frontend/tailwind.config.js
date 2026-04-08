/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#7c6af7", dark: "#6b5af0", light: "#9d8fff" },
        surface: { DEFAULT: "#111118", 2: "#1a1a24", 3: "#22222f" },
      },
      fontFamily: {
        sans:    ["DM Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
    },
  },
  plugins: [],
};