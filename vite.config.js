import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
            manifest: {
                name: 'AI写作引擎',
                short_name: '写作引擎',
                description: 'AI驱动的网络小说创作伴侣 — 从大纲到创作的完整AI辅助工作流',
                theme_color: '#1a1a2e',
                background_color: '#1a1a2e',
                display: 'standalone',
                display_override: ['window-controls-overlay'],
                orientation: 'any',
                scope: '/',
                start_url: '/',
                lang: 'zh-CN',
                categories: ['productivity', 'utilities'],
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
                        src: '/icons/icon-512-maskable.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        // API requests: NetworkFirst strategy
                        urlPattern: /^\/api\//,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60,
                            },
                            networkTimeoutSeconds: 10,
                        },
                    },
                    {
                        // External AI images/fonts
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'static-assets',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
    },
});
