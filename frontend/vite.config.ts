import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/tracking": { target: "http://localhost:3002", rewrite: (p) => p.replace(/^\/api/, "") },
      "/api/orders": { target: "http://localhost:3001", rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
  },
});
