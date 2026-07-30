import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3100,
    // Playwright-in-Docker reaches the host via host.docker.internal.
    allowedHosts: true,
  },
  plugins: [tanstackStart(), nitro(), react()],
})
