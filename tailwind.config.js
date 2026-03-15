/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        gold: { DEFAULT: '#C9A84C', light: '#E8C96A', dark: '#9B7A2F' },
        ink: { DEFAULT: '#0F0F0E', 2: '#1A1A18', 3: '#242422', 4: '#2E2E2B' },
      },
    },
  },
  plugins: [],
}
