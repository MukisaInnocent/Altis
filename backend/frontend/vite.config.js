import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
  },
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Altis Voyage Travel',
      short_name: 'Altis Voyage',
      theme_color: '#0F3D3E',
      background_color: '#FAF7F2',
      display: 'standalone',
      icons: [],
    },
  })],
})
