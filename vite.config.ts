import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { rmSync } from "node:fs";

/**
 * public/api/config.php es sólo para desarrollo local (ruta de datos de tu
 * equipo): nunca debe terminar en dist/ y subirse al servidor.
 */
const dropLocalConfig = () => ({
  name: "drop-local-api-config",
  closeBundle() {
    rmSync(fileURLToPath(new URL("./dist/api/config.php", import.meta.url)), { force: true });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), dropLocalConfig()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // En desarrollo, /api la sirve `php -S` (ver README).
    proxy: { "/api": "http://127.0.0.1:8090" },
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 900,
  },
});
