import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/bot/tiers";

const BODY = `User-agent: *
Allow: /
Disallow: /account
Disallow: /dashboard
Disallow: /auth
Disallow: /checkout-success
Disallow: /_authenticated/

Sitemap: ${SITE_URL}/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(BODY, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
    },
  },
});
