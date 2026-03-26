import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { vercelPreset } from "@vercel/react-router/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    },
    dedupe: ["react", "react-dom"]
  },
  plugins: [!process.env.VITEST && reactRouter({ presets: [vercelPreset()] })].filter(Boolean),
  ssr: {
    noExternal: [
      "react-markdown",
      "rehype-slug",
      "lucide-react",
      "framer-motion",
      "react-syntax-highlighter"
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
  server: {
    port: 5173,
    host: 'localhost'
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
