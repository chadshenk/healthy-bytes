/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        keyframes: {
          scanline: {
            '0%': { top: '0%' },
            '50%': { top: '100%' },
            '100%': { top: '0%' },
          }
        },
        animation: {
          scanline: 'scanline 2s linear infinite',
        }
      },
    },
    plugins: [],
  }