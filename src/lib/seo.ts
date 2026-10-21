import { SITE_URL } from "@/lib/bot/tiers";
import { localizePath } from "@/lib/i18n";

export type PageLocale = "en" | "ms";

export type OgImage = {
  /** Site-absolute path, e.g. "/og-default.png". */
  image: string;
  /** Real pixel dimensions of the file — never a guess. */
  width: number;
  height: number;
  alt?: string;
};

/**
 * OG images keyed by route slug, each with its true pixel dimensions. Social
 * cards trust these numbers: declaring a 512x512 logo as 1200x630 makes every
 * scraper crop or letterbox the card. A caller passes the slug as `image`.
 */
export const OG_IMAGES: Record<string, OgImage> = {
  default: { image: "/og-default.png", width: 1200, height: 630, alt: "EzyMap ALGO logo" },
  welcome: {
    image: "/og-welcome.png",
    width: 1200,
    height: 630,
    alt: "EzyMap ALGO — never miss a trade setup",
  },
};

/**
 * Resolve an `image` option to a real image + dimensions. A registry slug wins;
 * a full path string is the deprecated fallback (assumed 1200x630); nothing
 * means the site-wide default card.
 */
export function resolveOgImage(image?: string): OgImage {
  if (image && OG_IMAGES[image]) return OG_IMAGES[image];
  if (image && image.startsWith("/")) {
    // Deprecated: a bare path carries no dimensions, so we can only guess.
    return { image, width: 1200, height: 630 };
  }
  return OG_IMAGES.default;
}

export type LocalizedHeadOptions = {
  /** English path, e.g. "/privacy" or "/ebooks/mapping-like-a-pro". */
  path: string;
  locale: PageLocale;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: "website" | "article";
  /** An OG_IMAGES slug, or a full path string (deprecated). */
  image?: string;
  imageAlt?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  /**
   * Malay twin path, or `null` when this page has no Malay twin. Omitted means
   * the twin exists at `localizePath(path, "ms")`. `null` drops the ms and
   * x-default alternates so a page never claims a translation it does not have.
   */
  msPath?: string | null;
  /** Breadcrumb leaf name; falls back to the title's first dash segment. */
  crumbName?: string;
};

/** The Malay twin path, or null when the page has none. */
function twinPath(o: LocalizedHeadOptions): string | null {
  return o.msPath === undefined ? localizePath(o.path, "ms") : o.msPath;
}

/** Leaf name for the breadcrumb, preferring the explicit `crumbName`. */
function crumbFor(o: LocalizedHeadOptions): string {
  return o.crumbName ?? o.title.split(/ [—|–-] /)[0];
}

/**
 * BreadcrumbList JSON-LD, exported separately so a caller that adds its own
 * script (a Book, a HowTo) can keep the breadcrumb instead of dropping it.
 */
export function buildBreadcrumbJsonLd(o: LocalizedHeadOptions): string {
  const twin = twinPath(o);
  const self = twin !== null && o.locale === "ms" ? `${SITE_URL}${twin}` : `${SITE_URL}${o.path}`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: o.locale === "ms" ? "Utama" : "Home",
        item: o.locale === "ms" ? `${SITE_URL}/ms` : `${SITE_URL}/`,
      },
      { "@type": "ListItem", position: 2, name: crumbFor(o), item: self },
    ],
  });
}

/**
 * Head for a page that exists at `/x` (en) and `/ms/x` (ms): self-canonical,
 * reciprocal hreflang (en/ms/x-default) and matching og:locale pair. Keeps the
 * route files from repeating the same 30-line block.
 */
export function localizedHead(o: LocalizedHeadOptions) {
  const twin = twinPath(o);
  const hasTwin = twin !== null;
  const enUrl = `${SITE_URL}${o.path}`;
  const msUrl = hasTwin ? `${SITE_URL}${twin}` : null;
  const self = hasTwin && o.locale === "ms" ? (msUrl as string) : enUrl;
  const og = resolveOgImage(o.image);
  const image = `${SITE_URL}${og.image}`;
  const ogTitle = o.ogTitle ?? o.title;
  const localeTag = o.locale === "ms" ? "ms_MY" : "en_US";
  // With no twin, do not claim one: the alternate stays the page's own locale.
  const alternateTag = hasTwin ? (o.locale === "ms" ? "en_US" : "ms_MY") : localeTag;
  const meta: Array<Record<string, string>> = [
    { title: o.title },
    { name: "description", content: o.description },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: o.ogDescription ?? o.description },
    { property: "og:type", content: o.ogType ?? "website" },
    { property: "og:url", content: self },
    { property: "og:site_name", content: "EzyMap ALGO" },
    { property: "og:locale", content: localeTag },
    { property: "og:locale:alternate", content: alternateTag },
    { property: "og:image", content: image },
    {
      property: "og:image:alt",
      content:
        o.imageAlt ?? og.alt ?? (o.locale === "ms" ? "Logo EzyMap ALGO" : "EzyMap ALGO logo"),
    },
    { property: "og:image:width", content: String(og.width) },
    { property: "og:image:height", content: String(og.height) },
    { name: "theme-color", content: "#1e293b" },
    { name: "twitter:card", content: o.twitterCard ?? "summary_large_image" },
    { name: "twitter:title", content: o.twitterTitle ?? ogTitle },
    { name: "twitter:description", content: o.twitterDescription ?? o.description },
    { name: "twitter:image", content: image },
  ];

  const links: Array<{ rel: string; href: string; hrefLang?: string }> = [
    { rel: "canonical", href: self },
    { rel: "alternate", hrefLang: "en", href: enUrl },
  ];
  if (hasTwin) links.push({ rel: "alternate", hrefLang: "ms", href: msUrl as string });
  links.push({ rel: "alternate", hrefLang: "x-default", href: enUrl });

  return {
    meta,
    scripts: [{ type: "application/ld+json", children: buildBreadcrumbJsonLd(o) }],
    links,
  };
}
