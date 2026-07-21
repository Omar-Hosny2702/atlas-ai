/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paper / ink — the two base surfaces, named for the atlas/cartography
        // identity rather than generic "gray-50/gray-900".
        paper: {
          DEFAULT: '#FAFAF7',
          alt: '#F1EFEA',
        },
        ink: {
          DEFAULT: '#0E1116',
          alt: '#161B22',
          raised: '#1C2230',
        },
        border: {
          light: '#E5E3DD',
          dark: '#262C36',
        },
        muted: {
          light: '#6B7280',
          dark: '#8B93A0',
        },
        // Primary accent: a chart/compass teal. Used for interactive elements.
        accent: {
          50: '#EAF7F3',
          100: '#CDEEE3',
          200: '#9BDCC8',
          300: '#65C6AA',
          400: '#38AF8E',
          500: '#1F8A70',
          600: '#187360',
          700: '#145C4D',
          800: '#11493E',
          900: '#0D3A32',
          light: '#1F8A70',
          dark: '#2DD4A8',
        },
        // Secondary accent: a compass-rose gold, used sparingly for the
        // signature contour/marker motif — never for primary UI actions.
        gold: {
          light: '#B8892A',
          dark: '#D8B54C',
        },
        danger: {
          light: '#C53434',
          dark: '#E5605F',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
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
