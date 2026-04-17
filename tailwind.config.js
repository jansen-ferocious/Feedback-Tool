/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9d267b',
          light: '#d146ac',
        },
        secondary: {
          DEFAULT: '#6a479d',
          light: '#a586d0',
        },
        surface: {
          light: '#f8fafc', // slate-50
          dark: '#0f172a', // slate-900
        },
        card: {
          light: '#ffffff',
          dark: '#1e293b', // slate-800
        },
        border: {
          light: '#e2e8f0', // slate-200
          dark: '#334155', // slate-700
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
