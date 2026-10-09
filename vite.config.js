import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path for GitHub Pages repository deployment
  base: process.env.BASE_PATH || '/codeq/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          highlight: ['highlight.js'],
          marked: ['marked'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
