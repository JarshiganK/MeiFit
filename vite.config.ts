import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }
import { globalHeaders, matchesPath, pathHeaders } from './config/headers.ts'

/** Local build date as YYYY-MM-DD (the app's date helpers are not available here). */
function buildDate(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Applies the path-specific headers from config/headers.ts to `vite preview`. */
function previewPathHeaders(): Plugin {
  return {
    name: 'dq-preview-path-headers',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '/').split('?')[0] ?? '/'
        for (const [pattern, headers] of Object.entries(pathHeaders)) {
          if (!matchesPath(pattern, path)) continue
          for (const [name, value] of Object.entries(headers)) res.setHeader(name, value)
        }
        next()
      })
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(buildDate()),
  },
  plugins: [
    react(),
    tailwindcss(),
    previewPathHeaders(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon-180x180.png',
        'theme-init.js',
      ],
      manifest: {
        id: '/',
        name: 'Daily Quest',
        short_name: 'Daily Quest',
        description: 'Daily quests for food, training, sleep and study.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0e1220',
        theme_color: '#0e1220',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Only Latin font subsets are precached; the app's copy is English.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}', '**/*latin*.woff2'],
        // The debug console is large and rarely used: cache it the first time it loads.
        globIgnores: ['**/eruda-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/assets\/eruda-[\w-]+\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'debug-console' },
          },
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rolldownOptions: {
      onLog(level, log, handler) {
        // Eruda's console uses eval to run typed commands. The CSP blocks that on
        // purpose (logs and errors still show), so this one warning is expected.
        if (log.code === 'EVAL' && /[\\/]node_modules[\\/]eruda[\\/]/.test(log.id ?? '')) return
        handler(level, log)
      },
    },
  },
  preview: {
    headers: globalHeaders,
  },
})
