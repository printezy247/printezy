import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/bot/tiers";
import { EBOOK_PAGES } from "@/lib/ebooks";

/**
 * Generated, not hand-written, so it can never go stale. Only the static
 * indexable routes plus one entry per real ebook — never a fabricated
 * <lastmod>, since none of these routes have a real timestamp to report.
 */
const STATIC_ROUTES: { path: string; priority: string }[] = [
  { path: "/", priority: "1.0" },
  { path: "/indicators", priority: "0.8" },
  { path: "/macro", priority: "0.8" },
  { path: "/ezyai", priority: "0.8" },
  { path: "/free-channel", priority: "0.7" },
  { path: "/faq", priority: "0.6" },
  { path: "/privacy", priority: "0.3" },
  { path: "/terms", priority: "0.3" },
];

function buildSitemap(): string {
  const urls = [
    ...STATIC_ROUTES.map(
      ({ path, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <priority>${priority}</priority>
  </url>`,
    ),
    ...EBOOK_PAGES.map(
      (book) => `  <url>
    <loc>${SITE_URL}/ebooks/${book.slug}</loc>
    <priority>0.7</priority>
  </url>`,
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(buildSitemap(), {
          headers: { "Content-Type": "application/xml" },
        });
      },
    },
  },
});
