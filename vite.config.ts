import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      closeBundle() {
        // Copy manifest.json to dist
        copyFileSync('manifest.json', 'dist/manifest.json')
        
        // Copy background.js to dist
        copyFileSync('background.js', 'dist/background.js')
        
        console.log('✅ Copied extension files to dist/')
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
