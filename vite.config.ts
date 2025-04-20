import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 目标 API 地址
        changeOrigin: true, // 是否跨域
        ws: true, // 是否启用 WebSocket
      }
    }
  }
})
