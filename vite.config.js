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

  plugins: [reactRouter({ presets: [vercelPreset()] })].filter(Boolean),
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase/')) return 'vendor-firebase';
          if (id.includes('node_modules/framer-motion') || 
              id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/recharts')) {
            return 'vendor-ui';
          }
        }
      }
    }
  },
})
