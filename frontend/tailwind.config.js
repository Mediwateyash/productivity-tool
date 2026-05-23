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
        brand: {
          950: '#070a13',
          900: '#0c1223',
          800: '#141e37',
          700: '#1e2d4e',
          600: '#2a3d67',
          500: '#3c558c',
          400: '#5472b5',
          primary: '#3b82f6', // bright navy focus
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
