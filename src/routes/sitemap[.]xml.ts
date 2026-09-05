import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/bot/tiers";
import { EBOOK_PAGES } from "@/lib/ebooks";

/**
 * Generated, not hand-written, so it can never go stale. Only the static
 * indexable routes plus one entry per real ebook — never a fabricated
 * <lastmod>, since none of these routes have a real timestamp to report.
 * `msPath` is set only for the 3 routes with a genuine, fully-translated
 * /ms/ twin (see src/routes/ms.tsx, ms.faq.tsx, ms.ezyai.tsx) — every other
 * route stays English-only until it has real Malay copy.
 */
const STATIC_ROUTES: { path: string; priority: string; msPath?: string }[] = [
  { path: "/", priority: "1.0", msPath: "/ms" },
  { path: "/indicators", priority: "0.8" },
  { path: "/macro", priority: "0.8" },
  { path: "/ezyai", priority: "0.8", msPath: "/ms/ezyai" },
  { path: "/free-channel", priority: "0.7" },
  { path: "/faq", priority: "0.6", msPath: "/ms/faq" },
  { path: "/privacy", priority: "0.3" },
  { path: "/terms", priority: "0.3" },
];

function urlEntry(path: string, priority: string, msPath?: string, enPath?: string): string {
  const alternates = msPath
    ? `
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${enPath ?? path}" />
    <xhtml:link rel="alternate" hreflang="ms" href="${SITE_URL}${msPath}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${enPath ?? path}" />`
    : "";
  return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <priority>${priority}</priority>${alternates}
  </url>`;
}

function buildSitemap(): string {
  const urls = [
    ...STATIC_ROUTES.map(({ path, priority, msPath }) => urlEntry(path, priority, msPath)),
    ...STATIC_ROUTES.filter((r) => r.msPath).map((r) => urlEntry(r.msPath!, r.priority, r.msPath, r.path)),
    ...EBOOK_PAGES.map((book) => urlEntry(`/ebooks/${book.slug}`, "0.7")),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
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
