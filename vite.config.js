import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Forward /api to Vercel (or override with VITE_DEV_API_PROXY in .env). Needed for `vite` and `vite preview`. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget =
    (env.VITE_DEV_API_PROXY || "").trim() || "https://eventops-fawn.vercel.app";
  const apiProxy = {
    "/api": {
      target: apiProxyTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    cacheDir: "node_modules/.vite",
    build: {
      sourcemap: true,
    },
    server: {
      port: 5173,
      proxy: apiProxy,
    },
    // Without this, `npm run preview` has no /api proxy → saves fail with "Failed to fetch".
    preview: {
      proxy: apiProxy,
    },
  };
});
