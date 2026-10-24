import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/bot/tiers";
import { EBOOK_PAGES } from "@/lib/ebooks";
import { EZYAI_BOARD_VISIBLE } from "@/lib/ezyai/visibility";

/**
 * Generated, not hand-written, so it can never go stale. Only the static
 * indexable routes plus one entry per real ebook — never a fabricated
 * <lastmod>, since none of these routes have a real timestamp to report.
 * Alternates are stated explicitly per entry so the sitemap can express an
 * English-only page (no alternates) as well as a translated pair.
 */
type Alternate = { hrefLang: string; href: string };

/** en/ms/x-default alternates for a page that has a real Malay twin. */
function twin(en: string, ms: string): Alternate[] {
  return [
    { hrefLang: "en", href: en },
    { hrefLang: "ms", href: ms },
    { hrefLang: "x-default", href: en },
  ];
}

type UrlEntry = { path: string; priority: string; alternates?: Alternate[] };

const STATIC_ROUTES: UrlEntry[] = [
  // `/` has no Malay twin (it is the English-only Welcome page), so it carries
  // no alternates — matching its own head tags. `/ms` is the Landing twin of
  // `/home`, not of `/`, and gets its own <loc> below.
  { path: "/", priority: "1.0" },
  { path: "/home", priority: "0.9", alternates: twin("/home", "/ms") },
  { path: "/ms", priority: "0.9", alternates: twin("/home", "/ms") },
  { path: "/indicators", priority: "0.8", alternates: twin("/indicators", "/ms/indicators") },
  { path: "/macro", priority: "0.8", alternates: twin("/macro", "/ms/macro") },
  { path: "/free-channel", priority: "0.7", alternates: twin("/free-channel", "/ms/free-channel") },
  { path: "/faq", priority: "0.6", alternates: twin("/faq", "/ms/faq") },
  { path: "/privacy", priority: "0.3", alternates: twin("/privacy", "/ms/privacy") },
  { path: "/terms", priority: "0.3", alternates: twin("/terms", "/ms/terms") },
  // Language-neutral generated files: plain URLs, no alternates.
  { path: "/llms.txt", priority: "0.4" },
  { path: "/.well-known/security.txt", priority: "0.4" },
  // Gated on the same flag the route and the nav use (src/lib/ezyai/
  // visibility.ts): listing a route that redirects is how a sitemap earns a
  // crawl warning, so the entry appears exactly when the board does.
  ...(EZYAI_BOARD_VISIBLE
    ? ([{ path: "/ezyai", priority: "0.8", alternates: twin("/ezyai", "/ms/ezyai") }] as UrlEntry[])
    : []),
];

function urlEntry({ path, priority, alternates = [] }: UrlEntry): string {
  const altXml = alternates
    .map(
      (a) =>
        `\n    <xhtml:link rel="alternate" hreflang="${a.hrefLang}" href="${SITE_URL}${a.href}" />`,
    )
    .join("");
  return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <priority>${priority}</priority>${altXml}
  </url>`;
}

export function buildSitemap(): string {
  const ebookEntries: UrlEntry[] = EBOOK_PAGES.flatMap((book) => {
    const en = `/ebooks/${book.slug}`;
    const ms = `/ms/ebooks/${book.slug}`;
    return [
      { path: en, priority: "0.7", alternates: twin(en, ms) },
      { path: ms, priority: "0.7", alternates: twin(en, ms) },
    ];
  });

  const urls = [...STATIC_ROUTES, ...ebookEntries].map(urlEntry);

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
