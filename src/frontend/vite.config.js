import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Tách vendor lớn thành chunk riêng để cache tốt hơn & giảm bundle chính
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion': ['framer-motion'],
          'query': ['axios', 'zustand'],
          'form': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
});
