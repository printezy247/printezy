import { createFileRoute } from "@tanstack/react-router";
import { Landing, brandLogo } from "@/components/landing/Landing";
import { SITE_URL } from "@/lib/bot/tiers";

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
      { property: "og:image", content: `${SITE_URL}${brandLogo}` },
      { name: "facebook-domain-verification", content: "tbn6gbwzvnlav1zi9hbxkcc1jve6bn" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}${brandLogo}` },
    ],
  }),
  component: Landing,
});
