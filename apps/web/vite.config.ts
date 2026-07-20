import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  // Monorepo: load VITE_* from repo root .env (OpenAI, Firebase, etc.)
  envDir: path.resolve(__dirname, '../..'),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'buddy-icon.svg'],
      manifest: {
        name: 'Buddy',
        short_name: 'Buddy',
        description: 'AI companion for becoming an AI Engineer',
        theme_color: '#0f1c2e',
        background_color: '#0a1220',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'buddy-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'buddy-pages',
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@buddy/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
});
