import { createFileRoute } from "@tanstack/react-router";
import { Welcome } from "@/components/landing/Welcome";
import { SITE_URL } from "@/lib/bot/tiers";

const OG_IMAGE = `${SITE_URL}/og-welcome.png`;
const TITLE = "Never Miss a Trade Setup — Free Signals on Telegram | EzyMap ALGO";
const DESC =
  "Get live trading alerts with entry, stop and targets sent straight to your phone. Join 640+ traders in the free EzyMap Telegram channel. No card needed.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "EzyMap ALGO logo and the headline: Never miss a trade setup",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "ms", href: `${SITE_URL}/ms` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/` },
    ],
  }),
  component: Welcome,
});
