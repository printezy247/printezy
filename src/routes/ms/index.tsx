import { createFileRoute } from "@tanstack/react-router";
import { Landing, brandLogo } from "@/components/landing/Landing";
import { SITE_URL } from "@/lib/bot/tiers";
import { PRODUCTS_JSON_LD } from "../index";

export const Route = createFileRoute("/ms/")({
  head: () => ({
    meta: [
      { title: "EzyMap ALGO — Isyarat Dagangan Profesional di Telegram" },
      {
        name: "description",
        content:
          "Sertai 640+ peniaga menerima isyarat dagangan langsung dan pendidikan di Telegram. Amaran forex, kripto dan komoditi masa nyata dikuasakan oleh penunjuk TradingView.",
      },
      { property: "og:title", content: "EzyMap ALGO — Isyarat Dagangan Profesional di Telegram" },
      {
        property: "og:description",
        content: "Isyarat langsung dan pendidikan harian untuk 640+ peniaga. Mula percuma, naik taraf ke Pro, Premium atau Elite.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/ms` },
      { property: "og:locale", content: "ms_MY" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:image", content: `${SITE_URL}${brandLogo}` },
      { property: "og:image:alt", content: "Logo EzyMap ALGO" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}${brandLogo}` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/ms` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "ms", href: `${SITE_URL}/ms` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/` },
    ],
    scripts: [{ type: "application/ld+json", children: PRODUCTS_JSON_LD }],
  }),
  component: Landing,
});
