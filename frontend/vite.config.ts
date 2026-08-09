import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const appName = env.VITE_APP_NAME?.trim() || 'StudyFlow'

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['studyflow-icon.svg'],
        manifest: {
          name: appName,
          short_name: appName,
          description: 'Không gian tổ chức kế hoạch, công việc và thời gian học tập.',
          theme_color: '#3867e8',
          background_color: '#f5f7fb',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          lang: 'vi',
          icons: [{ src: '/studyflow-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
          runtimeCaching: [{
            urlPattern: ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/'),
            handler: 'NetworkOnly',
            method: 'GET',
            options: { cacheName: 'studyflow-sensitive-network-only' },
          }],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('recharts') || id.includes('d3-')) return 'charts'
            if (id.includes('@dnd-kit')) return 'drag-drop'
            if (id.includes('@tanstack')) return 'query'
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms'
            return 'vendor'
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': { target: 'http://localhost:4000', changeOrigin: true },
        '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
      },
    },
  }
})
