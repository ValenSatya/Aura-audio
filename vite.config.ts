import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                '@distube/ytdl-core',
                'papaparse',
              ],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
  ],
  server: {
    port: 5173,
  },
});
