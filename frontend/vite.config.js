import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split heavy charting library Recharts & D3
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // Split premium animation library Framer Motion
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // Split Lucide Icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Other third-party dependencies
            return 'vendor-core';
          }
        }
      }
    }
  }
})
