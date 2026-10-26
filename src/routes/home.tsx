import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/landing/Landing";
import { SITE_URL } from "@/lib/bot/tiers";
import { CATALOG, type CatalogItem } from "@/lib/catalog";
import { localizedHead, type PageLocale } from "@/lib/seo";
import { translations } from "@/lib/translations";

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
      return `${SITE_URL}/home#${item.sku}`;
    case "tradingview":
      return `${SITE_URL}/indicators#${item.sku}`;
    case "mt5":
      return `${SITE_URL}/indicators#${item.sku.replace(/_(1m|6m|1y)$/, "")}`;
    case "macro":
      return `${SITE_URL}/macro`;
    default:
      return `${SITE_URL}/pricing`;
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

/**
 * The landing page's head, per locale. Every translated twin (`/zh`, `/ms`, …)
 * and the English `/home` share it, so the title, description and the
 * reciprocal hreflang set can never drift between them.
 */
export function homeHead(locale: PageLocale) {
  const t = translations[locale];
  const HEAD = localizedHead({
    path: "/home",
    locale,
    title: t.home_meta_title,
    description: t.home_meta_desc,
    image: "default",
    crumbName: "EzyMap ALGO",
  });
  return {
    ...HEAD,
    // Only the real site has a Facebook domain claim to assert.
    meta: [
      ...HEAD.meta,
      ...(locale === "en"
        ? [{ name: "facebook-domain-verification", content: "tbn6gbwzvnlav1zi9hbxkcc1jve6bn" }]
        : []),
    ],
    scripts: [...HEAD.scripts, { type: "application/ld+json", children: PRODUCTS_JSON_LD }],
  };
}

export const Route = createFileRoute("/home")({
  head: () => homeHead("en"),
  component: Landing,
});
