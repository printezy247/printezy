import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({
  plugins: [tsconfigPaths()],
  // Same injection as vite.config.ts — tests import modules that read
  // __BUILD_DATE__ (sitemap lastmod), so it must exist outside builds too.
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
