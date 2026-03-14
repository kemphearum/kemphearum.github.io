import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { vercelPreset } from "@vercel/react-router/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [reactRouter({ presets: [vercelPreset()] })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
