import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const atlas = require('./tailwind.atlas-theme.cjs');

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ...atlas.colors,
        gold: {
          light: '#B8892A',
          dark: '#D8B54C',
        },
      },
      fontFamily: atlas.fontFamily,
      boxShadow: atlas.boxShadow,
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        contour: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-400' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-in-left': 'slide-in-left 0.2s ease-out',
        'pulse-dot': 'pulse-dot 1.2s ease-in-out infinite',
        contour: 'contour 24s linear infinite',
      },
    },
  },
  plugins: [],
};
