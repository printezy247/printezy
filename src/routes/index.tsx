import { createFileRoute } from "@tanstack/react-router";
import { Landing, brandLogo } from "@/components/landing/Landing";
import { SITE_URL } from "@/lib/bot/tiers";
import { CATALOG, type CatalogItem } from "@/lib/catalog";

/**
 * Where a sku's purchase anchor actually lives, so Offer.url points at a
 * real element instead of an invented one — mirrors the DOM ids Landing.tsx
 * (package tiers) and Tools.tsx (TradingView/MT5 cards) already render.
 * MT5 cards render one anchor per tool family (no term suffix), so strip
 * the trailing _1m/_6m/_1y before linking.
 */
function offerUrlFor(item: CatalogItem): string {
  switch (item.group) {
    case "package":
      return `${SITE_URL}/#${item.sku}`;
    case "tradingview":
      return `${SITE_URL}/indicators#${item.sku}`;
    case "mt5":
      return `${SITE_URL}/indicators#${item.sku.replace(/_(1m|6m|1y)$/, "")}`;
    case "macro":
      return `${SITE_URL}/macro`;
  }
}

export const PRODUCTS_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: CATALOG.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Product",
      name: item.name,
      description: item.description,
      brand: { "@type": "Brand", name: "EzyMap ALGO" },
      offers: {
        "@type": "Offer",
        price: (item.amountCents / 100).toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: offerUrlFor(item),
      },
    },
  })),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EzyMap ALGO — Professional Trading Signals on Telegram" },
      {
        name: "description",
        content:
          "Join 640+ traders receiving live trading signals and education on Telegram. Real-time forex, crypto and commodity alerts powered by TradingView indicators.",
      },
      { property: "og:title", content: "EzyMap ALGO — Professional Trading Signals on Telegram" },
      {
        property: "og:description",
        content:
          "Live signals and daily education for 640+ traders. Start free, upgrade to Pro, Premium or Elite.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ms_MY" },
      { property: "og:image", content: `${SITE_URL}${brandLogo}` },
      { property: "og:image:alt", content: "EzyMap ALGO logo" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "facebook-domain-verification", content: "tbn6gbwzvnlav1zi9hbxkcc1jve6bn" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}${brandLogo}` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "ms", href: `${SITE_URL}/ms` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/` },
    ],
    scripts: [{ type: "application/ld+json", children: PRODUCTS_JSON_LD }],
  }),
  component: Landing,
});
