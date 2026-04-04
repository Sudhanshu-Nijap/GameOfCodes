/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00FF9D",
          dark: "#00B36E",
          light: "#66FFC4",
        }
      }
    },
  },
  plugins: [],
}
