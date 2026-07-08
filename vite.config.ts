import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLE_FILE=1 npm run build → one self-contained index.html (used for the
// hosted Artifact build; everything inlined, runs on the simulated market).
//
// Dev-server proxies for external data connectors (browsers can't hit these
// hosts directly due to CORS). In production the same /yf route is served by
// api/yf.js on Vercel (see vercel.json) — static hosts fall back to SIM mode.
export default defineConfig({
  base: './',
  plugins: [react(), ...(process.env.SINGLE_FILE ? [viteSingleFile()] : [])],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
  server: {
    proxy: {
      '/yf': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/yf/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' },
      },
    },
  },
});
