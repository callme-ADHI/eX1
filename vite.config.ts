import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab:     resolve(__dirname, 'newtab.html'),
        content:    resolve(__dirname, 'src/content/content.tsx'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'newtab') return 'newtab.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (info) => {
          if (info.name?.endsWith('.css')) return '[name].[ext]';
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
});
