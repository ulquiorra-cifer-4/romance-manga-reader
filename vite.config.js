import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-image-proxy',
      configureServer(server) {
        server.middlewares.use('/api/img', async (req, res) => {
          const u = new URL(req.url, 'http://localhost');
          const target = u.searchParams.get('url');
          if (!target) {
            res.statusCode = 400;
            res.end('Missing url');
            return;
          }
          try {
            const upstream = await fetch(target, {
              headers: {
                'User-Agent': 'AmoreComix/1.0',
                Referer: 'https://mangadex.org',
              },
            });
            res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
            const buf = await upstream.arrayBuffer();
            res.end(Buffer.from(buf));
          } catch (e) {
            res.statusCode = 502;
            res.end(String(e));
          }
        });
      },
    },
  ],
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
