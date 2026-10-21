import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/landing/Landing";
import { localizedHead } from "@/lib/seo";
import { PRODUCTS_JSON_LD } from "../home";

const HEAD = localizedHead({
  path: "/home",
  locale: "ms",
  title: "EzyMap ALGO — Isyarat Dagangan Profesional di Telegram",
  description:
    "Sertai 640+ peniaga menerima isyarat dagangan langsung dan pendidikan di Telegram. Amaran forex, kripto dan komoditi masa nyata dikuasakan oleh penunjuk TradingView.",
  ogDescription:
    "Isyarat langsung dan pendidikan harian untuk 640+ peniaga. Mula percuma, naik taraf ke Pro, Premium atau Elite.",
  image: "default",
  crumbName: "Isyarat Dagangan Profesional",
});

export const Route = createFileRoute("/ms/")({
  head: () => ({
    ...HEAD,
    scripts: [...HEAD.scripts, { type: "application/ld+json", children: PRODUCTS_JSON_LD }],
  }),
  component: Landing,
});
