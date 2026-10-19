/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#080808',
          surface: '#111113',
          card: '#161619',
          elevated: '#1D1D22',
        },
        border: {
          subtle: '#252529',
          hover: '#36363E',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#8A8A91',
          muted: '#5A5A62',
        },
        accent: {
          DEFAULT: '#00FF88',
          hover: '#00E57A',
          subtle: 'rgba(0, 255, 136, 0.12)',
          border: 'rgba(0, 255, 136, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
