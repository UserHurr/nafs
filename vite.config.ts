import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/nafs/'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? base : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
