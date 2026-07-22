import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/landing/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PrintEzy — EzyMap Trading Plans" },
      {
        name: "description",
        content:
          "Map Gold and BTC trades with EzyMap, free ebooks, TradingView analysis, Telegram education, and Vantage partner onboarding.",
      },
      { property: "og:title", content: "PrintEzy — EzyMap Trading Plans" },
      {
        property: "og:description",
        content:
          "A premium trading education and analytics ecosystem for structured setups, mapped zones, and clear execution plans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
