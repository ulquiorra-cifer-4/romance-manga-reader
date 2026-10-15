import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/md-api': {
        target: 'https://api.mangadex.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/md-api/, ''),
        headers: { 'User-Agent': 'AmoreComix/1.0 (+https://blush-comics.vercel.app)' },
      },
      '/api/md': {
        target: 'https://api.mangadex.org',
        changeOrigin: true,
        rewrite: (p) => {
          const u = new URL(p, 'http://localhost');
          const path = (u.searchParams.get('path') || '').replace(/^\/+/, '');
          u.searchParams.delete('path');
          const qs = u.searchParams.toString();
          return `/${path}${qs ? '?' + qs : ''}`;
        },
        headers: { 'User-Agent': 'AmoreComix/1.0 (+https://blush-comics.vercel.app)' },
      },
    },
  },
})
