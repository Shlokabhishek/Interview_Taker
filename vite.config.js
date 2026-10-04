import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    process.env.VITE_USE_MKCERT === 'false' ? null : mkcert(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0)
    port: 3001,
    strictPort: true,
    https: process.env.VITE_USE_MKCERT === 'false' ? false : true, // Enable HTTPS for camera access when mkcert is available
    open: true,
  },
});
