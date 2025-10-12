import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  base: '/',
  server: {
    port: 3000,
    strictPort: false, // Permitir cambio automático de puerto si está ocupado
    host: '0.0.0.0', // Permitir conexiones externas
    proxy: {
      '/api': {
        target: 'http://192.168.1.10:5001',
        changeOrigin: true,
      },
    },
  },
})