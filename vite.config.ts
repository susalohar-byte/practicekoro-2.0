import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'apk-downloader-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          if (
            url === '/download-apk' ||
            url === '/PracticeKoro.apk' ||
            url === '/practicekoro-release.apk' ||
            url.endsWith('.apk')
          ) {
            const filePath = path.resolve(import.meta.dirname, 'public/PracticeKoro.apk');
            if (fs.existsSync(filePath)) {
              const stat = fs.statSync(filePath);
              res.writeHead(200, {
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Length': stat.size,
                'Content-Disposition': 'attachment; filename="PracticeKoro.apk"',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Accept-Ranges': 'bytes',
              });
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL || 'https://prycanbnxuihxhskallw.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWNhbmJueHVpaHhoc2thbGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTY1NTgsImV4cCI6MjEwNDg5MjU1OH0.HOzUGuRqD0Y9qWlGGhvHGenylTJ2Sky_G7E3PEO0EIw'
    ),
  },
  build: {
    // Warn when a single chunk grows past 600 kB (raw). CI enforces the
    // total dist budget separately — see .github/workflows/ci.yml.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/@remix-run')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          return undefined;
        },
      },
    },
  },
});
