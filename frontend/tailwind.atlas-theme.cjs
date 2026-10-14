/**
 * Atlas design tokens (Tailwind 3).
 *
 * Token NAMES match the ones the existing components already use
 * (ink / paper / border / muted / accent / danger), so most of the UI re-themes
 * without touching component code.
 *
 * Usage in your real tailwind.config.(js|cjs|ts):
 *
 *   const atlas = require('./tailwind.atlas-theme.cjs');
 *   module.exports = {
 *     darkMode: 'class',
 *     theme: { extend: {
 *       colors: atlas.colors,          // REPLACES your current `colors` block (see APPLY.md)
 *       fontFamily: atlas.fontFamily,
 *       boxShadow: atlas.boxShadow,
 *       // keep your existing keyframes / animation (fade-in, pulse-dot) as they are
 *     } },
 *   };
 */
module.exports = {
  colors: {
    // Dark surfaces: #050a13 is the personal site's theme-color (verified from its <meta>).
    ink: { DEFAULT: '#050a13', alt: '#0a1322', raised: '#101c30' },
    // Light theme surfaces / text-on-dark
    paper: { DEFAULT: '#f5f8fc', alt: '#e4ebf4' },
    border: { light: '#d3dde9', dark: '#1a2a43' },
    muted: { light: '#53647c', dark: '#8fa3bf' },
    accent: {
      50: '#ecfbfe',
      100: '#d0f4fb',
      200: '#a3e8f6',
      300: '#7ddcf2',
      400: '#53d3ee',
      500: '#0b6f8c', // accent on light surfaces (5.4:1 on paper)
      600: '#0a6280',
      700: '#0a5168',
      800: '#083e50',
      900: '#062c3a',
      dark: '#53d3ee', // accent on dark surfaces (11:1 on ink)
    },
    danger: { light: '#b3263c', dark: '#ff8a98' },
  },
  fontFamily: {
    // Placeholder pairing until the personal site's real fonts are confirmed.
    // Swap the CSS variables in atlas.css to change them everywhere at once.
    sans: ['var(--atlas-font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    display: ['var(--atlas-font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['var(--atlas-font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  },
  boxShadow: {
    // Navy-tinted, low-spread shadows instead of grey drop shadows
    'atlas-sm': '0 1px 2px rgb(2 6 14 / 0.35)',
    'atlas-md': '0 8px 24px -8px rgb(2 6 14 / 0.55), 0 0 0 1px rgb(83 211 238 / 0.04)',
    'atlas-lg': '0 24px 60px -20px rgb(2 6 14 / 0.75), 0 0 0 1px rgb(83 211 238 / 0.06)',
  },
};
