import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/landing/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PrintEzy — Free Trading Edge for Newbies & Pros" },
      { name: "description", content: "Free trading ebook, market analysis, and live signals channel. Built for traders from beginner to expert and busy professionals." },
      { property: "og:title", content: "PrintEzy — Free Trading Edge" },
      { property: "og:description", content: "Free ebook, free analysis, free channel. Real edge, zero cost." },
    ],
  }),
  component: Landing,
});
