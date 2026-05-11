import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/jaira-finance/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Jaira Finance',
        short_name: 'Jaira',
        description: 'Personal finance tracker that syncs to Google Sheets',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/jaira-finance/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Only cache app shell. Never cache Google API calls; they need fresh data + auth.
        navigateFallbackDenylist: [/^\/api/, /googleapis\.com/, /accounts\.google\.com/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://accounts.google.com' ||
              url.origin === 'https://sheets.googleapis.com' ||
              url.origin === 'https://www.googleapis.com',
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: { host: true, port: 5173 }
});
