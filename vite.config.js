import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { vercelPreset } from "@vercel/react-router/vite";
import { fileURLToPath, URL } from "node:url";

import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    },
    dedupe: ["react", "react-dom"]
  },

  plugins: [
    reactRouter({ presets: [vercelPreset()] }),
    visualizer({ open: false, filename: "bundle-analysis.html" })
  ].filter(Boolean),
  ssr: {
    noExternal: [
      "react-markdown",
      "rehype-slug",
      "lucide-react",
      "framer-motion",
      "react-syntax-highlighter"
    ]
  },

  server: {
    port: 5173,
    host: 'localhost'
  },
  build: {
    chunkSizeWarningLimit: 2000,
    // Let Vite and React Router handle chunking automatically.
    // manualChunks for vendor-ui was causing recharts and framer-motion to load on every page.
  },
})
