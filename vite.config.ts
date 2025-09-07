import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/gamma-api': {
        target: 'https://gamma-api.polymarket.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gamma-api/, ''),
        secure: true
      },
      '/clob-api': {
        target: 'https://clob.polymarket.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clob-api/, ''),
        secure: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
