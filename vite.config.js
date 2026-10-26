import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The prototype is served through a proxied preview host, so the dev server
// must accept any forwarded host header. All data stays in the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
