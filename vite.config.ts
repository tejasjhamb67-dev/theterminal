import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-server proxies for external data connectors (browsers can't hit these
// hosts directly due to CORS). Each connector in src/data/providers targets
// one of these paths. In production, terminate these routes at your own
// gateway (see docs/ARCHITECTURE.md → Data Connectors).
export default defineConfig({
  plugins: [react()],
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
