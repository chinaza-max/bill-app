/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DAA520', // Traditional gold
          50: '#FFF7E6',    // Lightest gold tint
          100: '#FFE5B4',   // Peach
          200: '#FFD700',   // Pure gold
          300: '#FFC125',   // Golden yellow
          400: '#EEB422',   // Goldenrod
          500: '#DAA520',   // Traditional gold (same as DEFAULT)
          600: '#B8860B',   // Dark goldenrod
          700: '#996515',   // Darker gold
          800: '#7B4F0A',   // Deep gold
          900: '#593812',
        },
        secondary: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
      },
    },
  },
  plugins: [],
};