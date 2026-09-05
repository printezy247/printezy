import { brandLogo } from "@/components/landing/Landing";
import { SITE_URL } from "@/lib/bot/tiers";
import { localizePath } from "@/lib/i18n";

type PageLocale = "en" | "ms";

type LocalizedHeadOptions = {
  /** English path, e.g. "/privacy" or "/ebooks/mapping-like-a-pro". */
  path: string;
  locale: PageLocale;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: "website" | "article";
  image?: string;
  imageAlt?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
};

/**
 * Head for a page that exists at `/x` (en) and `/ms/x` (ms): self-canonical,
 * reciprocal hreflang (en/ms/x-default) and matching og:locale pair. Keeps
 * the six route files from repeating the same 30-line block.
 */
export function localizedHead(o: LocalizedHeadOptions) {
  const enUrl = `${SITE_URL}${o.path}`;
  const msUrl = `${SITE_URL}${localizePath(o.path, "ms")}`;
  const self = o.locale === "ms" ? msUrl : enUrl;
  const image = `${SITE_URL}${o.image ?? brandLogo}`;
  const ogTitle = o.ogTitle ?? o.title;
  const meta: Record<string, string>[] = [
    { title: o.title },
    { name: "description", content: o.description },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: o.ogDescription ?? o.description },
    { property: "og:type", content: o.ogType ?? "website" },
    { property: "og:url", content: self },
    { property: "og:locale", content: o.locale === "ms" ? "ms_MY" : "en_US" },
    { property: "og:locale:alternate", content: o.locale === "ms" ? "en_US" : "ms_MY" },
    { property: "og:image", content: image },
    {
      property: "og:image:alt",
      content: o.imageAlt ?? (o.locale === "ms" ? "Logo EzyMap ALGO" : "EzyMap ALGO logo"),
    },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: o.twitterCard ?? "summary_large_image" },
    { name: "twitter:title", content: o.twitterTitle ?? ogTitle },
    { name: "twitter:image", content: image },
  ];
  if (o.twitterDescription)
    meta.push({ name: "twitter:description", content: o.twitterDescription });
  return {
    meta,
    links: [
      { rel: "canonical", href: self },
      { rel: "alternate", hrefLang: "en", href: enUrl },
      { rel: "alternate", hrefLang: "ms", href: msUrl },
      { rel: "alternate", hrefLang: "x-default", href: enUrl },
    ],
  };
}
