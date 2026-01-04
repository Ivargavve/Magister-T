/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Magister T green theme
        magister: {
          50: '#f4f9ec',
          100: '#e6f2d4',
          200: '#cee6ad',
          300: '#aed67c',
          400: '#97c755',
          500: '#87be3a',
          600: '#6a9a2c',
          700: '#527626',
          800: '#435e23',
          900: '#3a5021',
          950: '#1d2c0e',
        },
        // Warm library theme colors
        warm: {
          50: '#faf7f2',
          100: '#f5ebe0',
          200: '#e6d5c3',
          300: '#d4b896',
          400: '#c4a574',
          500: '#b8956a',
          600: '#a67c52',
          700: '#8b6544',
          800: '#6d4f36',
          900: '#5a4030',
          950: '#3d2a1e',
        },
        parchment: {
          50: '#fefdfb',
          100: '#faf6f0',
          200: '#f5ebe0',
          300: '#e8dcc8',
          400: '#d9c9ae',
          500: '#c9b494',
        },
        wood: {
          light: '#8b6f4e',
          DEFAULT: '#5d4037',
          dark: '#3e2723',
        },
        // Keep dark for backwards compatibility
        dark: {
          50: '#f7f7f8',
          100: '#ececf1',
          200: '#d9d9e3',
          300: '#c5c5d2',
          400: '#acacbe',
          500: '#8e8ea0',
          600: '#565869',
          700: '#40414f',
          800: '#343541',
          850: '#2a2b36',
          900: '#202123',
          950: '#0f0f14',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        chalk: ['Kalam', 'cursive'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(184, 149, 106, 0.15)',
        'glow-lg': '0 0 40px rgba(184, 149, 106, 0.2)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.35)',
        'paper': '2px 2px 8px rgba(0, 0, 0, 0.2), -1px -1px 4px rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'library': "url('/src/assets/librarybackground.png')",
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [],
}
