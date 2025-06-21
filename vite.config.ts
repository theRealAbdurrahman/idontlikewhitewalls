import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  server: {
    // Proxy API requests to the local backend
    proxy: {
      // Proxy all requests starting with /api to localhost:8000
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // Optional: Add logging to see what's being proxied
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '→', proxyReq.getHeader('host') + proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
    // Enable CORS for the dev server
    cors: true,
    // Optional: Set a specific port for consistency
    port: 5173,
    // Optional: Set host to allow external connections
    host: true,
  },
});