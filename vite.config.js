// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)), // alias tới thư mục src
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://vcr-naturals-surplus-caribbean.trycloudflare.com/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
