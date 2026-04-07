import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Aumentado a 5MB
      },
      manifest: {
        name: 'Gestion DA PWA',
        short_name: 'GestionDA',
        description: 'Aplicación para la gestión de personal de hoteles.',
        theme_color: '#ff9800',
        background_color: '#212121',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable']
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
          utils: ['xlsx', 'jspdf', 'jspdf-autotable', 'date-fns']
        }
      }
    }
  },
  resolve: {
    alias: {
      // Esto evita que el build falle si el archivo de AWS aún no existe
      './amplify_outputs.json': './amplify_outputs.json'
    }
  }
})
