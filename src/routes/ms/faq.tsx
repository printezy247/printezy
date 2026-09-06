import { createFileRoute } from "@tanstack/react-router";
import { brandLogo } from "@/components/landing/Landing";
import { SITE_URL } from "@/lib/bot/tiers";
import { FaqPage, buildFaqJsonLd } from "../faq";

export const Route = createFileRoute("/ms/faq")({
  head: () => ({
    meta: [
      { title: "Soalan Lazim — Isyarat Dagangan EzyMap ALGO" },
      {
        name: "description",
        content:
          "Jawapan tentang rutin dagangan EzyMap ALGO, peringkat harga, percubaan Vantage 30 hari, pendaftaran, akaun anda, dan sokongan.",
      },
      { property: "og:title", content: "Soalan Lazim — Isyarat Dagangan EzyMap ALGO" },
      {
        property: "og:description",
        content: "Semua yang anda perlu tahu tentang isyarat dan langganan EzyMap ALGO.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/ms/faq` },
      { property: "og:locale", content: "ms_MY" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:image", content: `${SITE_URL}${brandLogo}` },
      { property: "og:image:alt", content: "Logo EzyMap ALGO" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/ms/faq` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/faq` },
      { rel: "alternate", hrefLang: "ms", href: `${SITE_URL}/ms/faq` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/faq` },
    ],
    scripts: [{ type: "application/ld+json", children: buildFaqJsonLd("ms") }],
  }),
  component: FaqPage,
});
