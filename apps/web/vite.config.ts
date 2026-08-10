import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    host: "127.0.0.1",
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        wallpaper: resolve(__dirname, "wallpaper.html")
      }
    }
  }
});
