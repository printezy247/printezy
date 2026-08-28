import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/landing/Landing";

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
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
