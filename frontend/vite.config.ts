import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@/components': path.resolve(import.meta.dirname, './src/components'),
      '@/hooks': path.resolve(import.meta.dirname, './src/hooks'),
      '@/utils': path.resolve(import.meta.dirname, './src/utils'),
      '@/types': path.resolve(import.meta.dirname, './src/types'),
      '@/api': path.resolve(import.meta.dirname, './src/api'),
    },
  },
})
