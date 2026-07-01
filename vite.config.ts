import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.png'],
        manifest: {
          name: 'Noto',
          short_name: 'Noto',
          description: 'Simple and private local-first notes',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'icon.png',
              sizes: '192x192 512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 5000000,
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is conditionally disabled depending on the workspace environment.
      // File watching is managed to prevent conflicts during development.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during background compilations.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
