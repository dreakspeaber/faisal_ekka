import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.app',
      'localhost',
      /.*/
    ],
    strictPort: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
