import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/bot/tiers";
import { EBOOK_PAGES } from "@/lib/ebooks";
import { LOCALES, localizePath, type Locale } from "@/lib/i18n";
import { EZYAI_BOARD_VISIBLE } from "@/lib/ezyai/visibility";

/**
 * Generated, not hand-written, so it can never go stale. Only the static
 * indexable routes plus one entry per real ebook — never a fabricated
 * <lastmod>, since none of these routes have a real timestamp to report.
 *
 * A page with translated twins gets one <loc> per offered locale, and every
 * one of those entries carries the same complete alternate set: an hreflang
 * cluster is only valid when each member lists all the others.
 */
type Alternate = { hrefLang: string; href: string };
type UrlEntry = { path: string; priority: string; alternates?: Alternate[] };

/**
 * The alternate set for a page that exists in every listed locale. A page with
 * fewer editions lists only those: an hreflang cluster is a claim that the
 * page is written in that language, and an ebook exists in English and Malay
 * only.
 */
function alternatesFor(path: string, locales: Locale[]): Alternate[] {
  return [
    ...locales.map((locale) => ({ hrefLang: locale, href: localizePath(path, locale) })),
    { hrefLang: "x-default", href: path },
  ];
}

/** One <loc> per locale for a translated page. */
function localized(path: string, priority: string, locales: Locale[] = LOCALES): UrlEntry[] {
  const alternates = alternatesFor(path, locales);
  return locales.map((locale) => ({
    path: localizePath(path, locale),
    priority,
    alternates,
  }));
}

const STATIC_ROUTES: UrlEntry[] = [
  // `/` has no translated twin (it is the English-only welcome page), so it
  // carries no alternates — matching its own head tags. Each locale's landing
  // page is the twin of `/home`, not of `/`.
  { path: "/", priority: "1.0" },
  ...localized("/home", "0.9"),
  ...localized("/indicators", "0.8"),
  ...localized("/macro", "0.8"),
  ...localized("/free-channel", "0.7"),
  ...localized("/faq", "0.6"),
  ...localized("/privacy", "0.3"),
  ...localized("/terms", "0.3"),
  // Language-neutral generated files: plain URLs, no alternates.
  { path: "/llms.txt", priority: "0.4" },
  { path: "/.well-known/security.txt", priority: "0.4" },
  // Gated on the same flag the route and the nav use (src/lib/ezyai/
  // visibility.ts): listing a route that redirects is how a sitemap earns a
  // crawl warning, so the entry appears exactly when the board does.
  ...(EZYAI_BOARD_VISIBLE ? localized("/ezyai", "0.8") : []),
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
  // Only the editions that exist are listed: the four locales without one
  // still serve the page, but they canonicalise to the English copy, so a
  // <loc> for them would advertise a translation the book does not have.
  const ebookEntries: UrlEntry[] = EBOOK_PAGES.flatMap((book) =>
    localized(`/ebooks/${book.slug}`, "0.7", book.ms ? ["en", "ms"] : ["en"]),
  );

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
