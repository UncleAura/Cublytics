import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: ['cublytics.onrender.com'] // This tells Vite to trust your Render URL
  }
})
