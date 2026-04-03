import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Electron loadFile(file://) 时，资源须为相对路径；默认 base "/" 会导致 /assets/* 指向磁盘根而白屏
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    host: "127.0.0.1",
    strictPort: true
  }
});
