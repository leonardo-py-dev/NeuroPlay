import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // IPv4 explícito: em algumas máquinas o Vite escuta só em ::1 (IPv6)
    // e o navegador tenta 127.0.0.1 — resultando em "não carrega".
    host: '127.0.0.1',
    port: 5173,
  },
})
