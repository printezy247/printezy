import { createFileRoute } from "@tanstack/react-router";
import { buildLlmsTxt } from "@/lib/geo";

/**
 * /llms.txt — generated, not a static file, so it can never drift from the
 * site. Language-neutral, so it carries no hreflang alternates in the sitemap.
 */
export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(buildLlmsTxt(), {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
    },
  },
});
