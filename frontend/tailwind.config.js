/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eu-blue': '#003399',
        'eu-yellow': '#FFCC00',
      }
    },
  },
  plugins: [],
}