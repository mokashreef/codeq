import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative base path so assets load flawlessly under /codeq/ or any subpath
  base: './',
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
