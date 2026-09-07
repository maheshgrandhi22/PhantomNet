import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: process.cwd(),
  plugins: [react()],
  build: {
    rollupOptions: {
      input: path.resolve(process.cwd(), 'index.html')
    }
  }
})
