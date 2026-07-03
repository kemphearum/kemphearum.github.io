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
  // eslint-disable-next-line no-undef
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
    // Firestore rules tests require the emulator + @firebase/rules-unit-testing
    // and are run separately (firebase emulators:exec), not in the unit run.
    exclude: ['**/node_modules/**', '**/firestore.rules.test.mjs', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.react-router/**',
        '**/e2e/**',
        '**/eslint.config.js',
        '**/vite.config.js',
        '**/playwright.config.js'
      ]
    }
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
