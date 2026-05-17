/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        xm: {
          black: '#0a0a0a',
          dark: '#1a1a1a',
          card: '#242424',
          gold: '#c8a95a',
          goldLight: '#e0c878',
          bronze: '#b8864e',
          silver: '#a8a8a8',
          accent: '#d4a853',
          error: '#e74c3c',
          success: '#2ecc71',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
