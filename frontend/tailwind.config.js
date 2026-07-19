/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#8aa3ff',
          500: '#637bff',
          600: '#4753f5',
          700: '#393ee0',
          800: '#2e31b8',
          900: '#2a2d94',
        }
      }
    },
  },
  plugins: [],
}
