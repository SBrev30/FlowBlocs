import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      closeBundle() {
        // Ensure dist directory exists
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true })
          console.log('📁 Created dist directory')
        }
        
        // Check and copy manifest.json
        if (existsSync('manifest.json')) {
          copyFileSync('manifest.json', 'dist/manifest.json')
          console.log('✅ Copied manifest.json to dist/')
        } else {
          console.warn('⚠️  manifest.json not found in root directory')
        }
        
        // Check and copy background.js
        if (existsSync('background.js')) {
          copyFileSync('background.js', 'dist/background.js')
          console.log('✅ Copied background.js to dist/')
        } else {
          console.warn('⚠️  background.js not found in root directory')
        }
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
