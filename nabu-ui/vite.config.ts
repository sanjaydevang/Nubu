import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          content: resolve(__dirname, 'src/content/content.ts'),
          background: resolve(__dirname, 'src/background/background.ts'),
          'pdf-viewer': resolve(__dirname, 'src/pdf-viewer/pdf-viewer.html'),
          'pdf-viewer-vue': resolve(__dirname, 'src/pdf-viewer/pdf-viewer-vue.ts')
        },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      },
      external: ['lib/pdf.min.js']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
