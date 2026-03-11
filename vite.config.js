import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  cacheDir: "node_modules/.vite",
  build: {
    sourcemap: true,
  },
  define: {
    "process.env": process.env,
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy /api to production when using npm run dev (no local API)
      // Use npm run dev:full for local API on port 3000
      "/api": {
        target: "https://eventops-fawn.vercel.app",
        changeOrigin: true,
      },
    },
  },
});
