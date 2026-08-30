import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/nafs/'
const buildId = Date.now().toString()

// Emits an unhashed build-id.txt fetched (bypassing all caches) to detect a
// new deploy independently of the Service Worker update mechanism — iOS is
// known to throttle/delay SW update checks in standalone PWA mode.
function buildIdPlugin(): Plugin {
  return {
    name: 'nafs-build-id',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'build-id.txt', source: buildId })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? base : '/',
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    buildIdPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nafs — Agenda & Routines',
        short_name: 'Nafs',
        description: 'Agenda hebdomadaire, mensuel et annuel personnalisable, to-do list et routines matin/soir',
        theme_color: '#b8677a',
        background_color: '#fafafa',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      },
    }),
  ],
}))
