import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/cards/*.webp', 'assets/audio/*.wav'],
      manifest: {
        name: '深刻認識一個人',
        short_name: '深刻認識',
        description: '面對面進行的關係對話卡牌遊戲',
        lang: 'zh-TW',
        theme_color: '#FBF9F5',
        background_color: '#FBF9F5',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,webp,png,svg,wav,json,woff,woff2}'],
        globIgnores: ['**/og-image.png', '**/QrScannerModal*.*'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === 'image' || request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-media-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-pages-cache',
              networkTimeoutSeconds: 3,
            },
          },
        ],
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand', 'i18next', 'react-i18next'],
          peerjs: ['peerjs'],
          qrcode: ['qrcode'],
          framer: ['framer-motion'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
