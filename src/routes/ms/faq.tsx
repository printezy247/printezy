import { createFileRoute } from "@tanstack/react-router";
import { localizedHead } from "@/lib/seo";
import { FaqPage, buildFaqJsonLd } from "../faq";

const HEAD = localizedHead({
  path: "/faq",
  locale: "ms",
  title: "Soalan Lazim — Isyarat Dagangan EzyMap ALGO",
  description:
    "Jawapan tentang rutin dagangan EzyMap ALGO, peringkat harga, percubaan Vantage 30 hari, pendaftaran, akaun anda, dan sokongan.",
  ogDescription: "Semua yang anda perlu tahu tentang isyarat dan langganan EzyMap ALGO.",
  image: "default",
  crumbName: "Soalan Lazim",
});

export const Route = createFileRoute("/ms/faq")({
  head: () => ({
    ...HEAD,
    scripts: [...HEAD.scripts, { type: "application/ld+json", children: buildFaqJsonLd("ms") }],
  }),
  component: FaqPage,
});
