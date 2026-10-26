import { SITE_URL } from "@/lib/bot/tiers";
import { LOCALES, LOCALE_TAGS, localizePath, type Locale } from "@/lib/i18n";
import { EBOOK_COVER_MAPPING, EBOOK_COVER_TECHNICAL } from "@/lib/ebooks";

export type PageLocale = Locale;

/**
 * Breadcrumb label for the first crumb. Only ever read by JSON-LD, so it
 * lives here rather than in the UI translation table.
 */
const HOME_CRUMB: Record<Locale, string> = {
  en: "Home",
  ms: "Utama",
  zh: "首页",
  hi: "होम",
  ar: "الرئيسية",
  sw: "Mwanzo",
};

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
  // Ebook covers are A4 (1240x1754), not 1200x630. Registered here so the
  // card is not letterboxed; a bare path would fall back to the 1200x630 guess.
  "mapping-like-a-pro": {
    image: EBOOK_COVER_MAPPING,
    width: 1240,
    height: 1754,
    alt: "Mapping Like A Pro — ebook cover",
  },
  "technical-analysis": {
    image: EBOOK_COVER_TECHNICAL,
    width: 1240,
    height: 1754,
    alt: "Technical Analysis Ebook — cover",
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
   * `null` for a page with no translated twins at all (the English-only `/`
   * welcome page). Omitted means every offered locale has a twin at
   * `localizePath(path, locale)`, and the head advertises all of them.
   */
  twinPath?: null;
  /** Breadcrumb leaf name; falls back to the title's first dash segment. */
  crumbName?: string;
};

/** This page's URL in one locale: unprefixed for en, `/xx/...` otherwise. */
function pathFor(o: LocalizedHeadOptions, locale: Locale): string {
  return locale === "en" ? o.path : localizePath(o.path, locale);
}

/** Whether the page exists in the offered locales (or only in English). */
function hasTwins(o: LocalizedHeadOptions): boolean {
  return o.twinPath !== null;
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
  const self = `${SITE_URL}${pathFor(o, o.locale)}`;
  const home = o.locale === "en" ? `${SITE_URL}/` : `${SITE_URL}/${o.locale}`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: HOME_CRUMB[o.locale],
        item: home,
      },
      { "@type": "ListItem", position: 2, name: crumbFor(o), item: self },
    ],
  });
}

/**
 * Head for a page that exists at `/x` (en) and `/xx/x` in each prefixed
 * locale: self-canonical, reciprocal hreflang for every offered locale plus
 * x-default, and a matching og:locale pair. Keeps the route files from
 * repeating the same 30-line block.
 */
export function localizedHead(o: LocalizedHeadOptions) {
  const twins = hasTwins(o);
  const self = `${SITE_URL}${pathFor(o, o.locale)}`;
  const og = resolveOgImage(o.image);
  const image = `${SITE_URL}${og.image}`;
  const ogTitle = o.ogTitle ?? o.title;
  const localeTag = LOCALE_TAGS[o.locale];
  const meta: Array<Record<string, string>> = [
    { title: o.title },
    { name: "description", content: o.description },
    // Search engines read the language a page is written in from here, not
    // from <html lang>, when the page is fetched by a crawler without scripts.
    { httpEquiv: "content-language", content: o.locale },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: o.ogDescription ?? o.description },
    { property: "og:type", content: o.ogType ?? "website" },
    { property: "og:url", content: self },
    { property: "og:site_name", content: "EzyMap ALGO" },
    { property: "og:locale", content: localeTag },
    { property: "og:image", content: image },
    {
      property: "og:image:alt",
      content: o.imageAlt ?? og.alt ?? "EzyMap ALGO logo",
    },
    { property: "og:image:width", content: String(og.width) },
    { property: "og:image:height", content: String(og.height) },
    { name: "theme-color", content: "#1e293b" },
    { name: "twitter:card", content: o.twitterCard ?? "summary_large_image" },
    { name: "twitter:title", content: o.twitterTitle ?? ogTitle },
    { name: "twitter:description", content: o.twitterDescription ?? o.description },
    { name: "twitter:image", content: image },
  ];
  // One tag only, deliberately: the router keeps a single meta per property, so
  // five og:locale:alternate tags collapsed into whichever came last (every
  // page advertised sw_KE). The complete language cluster is in the hreflang
  // links below, which is what crawlers actually read; this tag names the
  // site's other primary market, and with no twins the page is its own.
  meta.push({
    property: "og:locale:alternate",
    content: LOCALE_TAGS[twins ? (o.locale === "ms" ? "en" : "ms") : o.locale],
  });

  const links: Array<{ rel: string; href: string; hrefLang?: string }> = [
    { rel: "canonical", href: self },
  ];
  const alternates = twins ? LOCALES : (["en"] as Locale[]);
  for (const locale of alternates) {
    links.push({
      rel: "alternate",
      hrefLang: locale,
      href: `${SITE_URL}${pathFor(o, locale)}`,
    });
  }
  links.push({ rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}${o.path}` });

  return {
    meta,
    scripts: [{ type: "application/ld+json", children: buildBreadcrumbJsonLd(o) }],
    links,
  };
}
