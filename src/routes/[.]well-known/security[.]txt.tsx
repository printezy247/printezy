import { createFileRoute } from "@tanstack/react-router";
import { buildSecurityTxt } from "@/lib/geo";

/**
 * /.well-known/security.txt — RFC 9116, generated at request time so Expires
 * is always valid. Language-neutral, so no hreflang alternates in the sitemap.
 */
export const Route = createFileRoute("/.well-known/security.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(buildSecurityTxt(), {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
    },
  },
});
