import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  root: 'renderer',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'core'),
      '@components': path.resolve(__dirname, 'renderer/src/components'),
      '@hooks': path.resolve(__dirname, 'renderer/src/hooks'),
      '@services': path.resolve(__dirname, 'renderer/src/services')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
