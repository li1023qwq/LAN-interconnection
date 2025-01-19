import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/ws': {
        target: 'http://localhost:8080',
        ws: true
      },
      '/api': {
        target: 'http://localhost:8080'
      }
    }
  },
  define: {
    global: 'window'
  }
}) 