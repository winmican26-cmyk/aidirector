import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    // Playwright specs are executed by the dedicated Playwright runner.
    // Keeping them out of Vitest prevents cross-runner errors in `pnpm test`.
    exclude: ["node_modules", ".next", "e2e/**", "**/*.e2e.{ts,tsx}"],
    setupFiles: ["./lib/__tests__/setup.ts"],
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
