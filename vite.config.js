import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site from /<repo>/ — set base accordingly.
  // For a project site at https://<user>.github.io/ravan-vadh/ the base is "/ravan-vadh/".
  // The workflow overrides this via VITE_BASE for custom domains (base "/").
  base: process.env.VITE_BASE || '/ravan-vadh/',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          postprocessing: ['postprocessing'],
          gsap: ['gsap'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
