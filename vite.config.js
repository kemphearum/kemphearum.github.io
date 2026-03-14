import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { vercelPreset } from "@vercel/react-router/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [reactRouter({ presets: [vercelPreset()] })],
  ssr: {
    noExternal: [
      "react-markdown",
      "rehype-raw",
      "rehype-slug",
      "dompurify",
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
})
