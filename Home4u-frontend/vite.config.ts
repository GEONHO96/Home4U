import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/apple-touch-icon.png',
        'screenshot-bootstrap.html',
        'vite.svg',
      ],
      manifest: {
        name: 'Home4U · 부동산 매물 거래',
        short_name: 'Home4U',
        description:
          '지도에서 매물을 찾고 한 번의 클릭으로 거래까지 진행하는 부동산 매물 플랫폼',
        lang: 'ko-KR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#ffffff',
        theme_color: '#1673ff',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 백엔드 API 는 캐시하지 않고 네트워크 우선으로
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/oauth\//, /\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'image-cache', expiration: { maxEntries: 60 } },
          },
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // dev 서버에서는 SW 비활성 (HMR 방해 방지)
      },
    }),
  ],
});
