import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Vite options tailored for Tauri development and optimized for development
  clearScreen: false,
  
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Path resolution for easier imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/providers": path.resolve(__dirname, "./src/providers"),
      "@/assets": path.resolve(__dirname, "./src/assets"),
    },
  },

  // Build configuration
  build: {
    // Tauri supports es2021
    target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      // Ensure external dependencies are not bundled
      external: [],
    },
  },

  // Environment variables
  define: {
    global: "globalThis",
  },

  // Optimize deps
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@chakra-ui/react",
      "@emotion/react",
      "@coinmasters/pioneer-sdk",
      "@coinmasters/types",
      "@coinmasters/tokens",
      "@pioneer-platform/pioneer-caip",
      "@pioneer-platform/pioneer-coins",
    ],
  },
});
