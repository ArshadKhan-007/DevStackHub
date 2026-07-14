import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/profile': 'http://localhost:5000',
      '/projects': 'http://localhost:5000',
      '/files': 'http://localhost:5000',
      '/dashboard': 'http://localhost:5000',
      '/search': 'http://localhost:5000',
      '/activity': 'http://localhost:5000',
      '/settings': 'http://localhost:5000',
      '/static': 'http://localhost:5000',
    },
  },
})
