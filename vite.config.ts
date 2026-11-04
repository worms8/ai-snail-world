import { defineConfig } from 'vite';

const PROXY_PORT = process.env.PROXY_PORT ?? '8787';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${PROXY_PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
