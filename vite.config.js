import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxies to the local API dev server (scripts/dev-server.mjs) so `npm run dev`
    // can call /api/generate-questions without needing Vercel CLI/account for local work.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
