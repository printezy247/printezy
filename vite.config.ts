// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Every image in src/assets/*.asset.json is served from /__l5e/assets-v1/* by
// Lovable's host. The dev-server proxy for those paths only switches on when
// LOVABLE_PREVIEW_HOST is set, so a plain `bun run dev` 404s the logo, the tier
// artwork and the charts. The published site serves the same bytes with
// immutable caching, so point the proxy there; a real preview host still wins.
process.env.LOVABLE_PREVIEW_HOST ??= "printezy.money";

export default defineConfig({
  vite: {
    // Build date injected for <lastmod> in sitemap.xml (and nothing else —
    // keep it that way). Declared in src/types/build-date.d.ts.
    define: {
      __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
