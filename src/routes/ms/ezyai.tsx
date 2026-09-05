import { createFileRoute } from "@tanstack/react-router";
import { brandLogo } from "@/components/landing/Landing";
import { SITE_URL } from "@/lib/bot/tiers";
import { EzyAiPage } from "../ezyai";

export const Route = createFileRoute("/ms/ezyai")({
  head: () => ({
    meta: [
      { title: "EzyAI — Isyarat Dagangan AI di Telegram | EzyMap Algo" },
      {
        name: "description",
        content:
          "EzyAI menukar data pasaran percuma menjadi keyakinan dagangan di Telegram — analisis teknikal, amaran tontonan langsung, asas dan isyarat autopilot, percuma untuk mula.",
      },
      { property: "og:title", content: "EzyAI — Isyarat Dagangan AI di Telegram" },
      {
        property: "og:description",
        content: "Analisis atas permintaan, amaran langsung, asas dan isyarat autopilot — percuma untuk mula.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/ms/ezyai` },
      { property: "og:locale", content: "ms_MY" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:image", content: `${SITE_URL}${brandLogo}` },
      { property: "og:image:alt", content: "Logo EzyMap ALGO" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "EzyAI — Isyarat Dagangan AI di Telegram" },
      { name: "twitter:image", content: `${SITE_URL}${brandLogo}` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/ms/ezyai` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/ezyai` },
      { rel: "alternate", hrefLang: "ms", href: `${SITE_URL}/ms/ezyai` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/ezyai` },
    ],
  }),
  component: EzyAiPage,
});
