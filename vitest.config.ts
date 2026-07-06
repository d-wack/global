import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/*" import alias from tsconfig natively (Vite 7+).
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Playwright specs live in e2e/ and must not be picked up by Vitest.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/*.d.ts"],
    },
  },
});
