import { createFileRoute } from "@tanstack/react-router";
import { Welcome } from "@/components/landing/Welcome";
import { brandLogo } from "@/components/landing/Landing";
import { SITE_URL } from "@/lib/bot/tiers";

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
      { property: "og:image", content: `${SITE_URL}${brandLogo}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}${brandLogo}` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  component: Welcome,
});
