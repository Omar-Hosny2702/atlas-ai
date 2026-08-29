import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 5173,

    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (
            id.includes(
              'react-syntax-highlighter'
            ) ||
            id.includes('refractor') ||
            id.includes('highlight.js')
          ) {
            return 'syntax';
          }

          if (
            id.includes('react-markdown') ||
            id.includes('remark-') ||
            id.includes('rehype-') ||
            id.includes('unified') ||
            id.includes('micromark')
          ) {
            return 'markdown';
          }

          if (
            id.includes('lucide-react')
          ) {
            return 'icons';
          }

          if (
            id.includes('react-dom') ||
            id.includes('/react/')
          ) {
            return 'react-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
});