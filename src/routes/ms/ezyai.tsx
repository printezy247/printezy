import { createFileRoute, redirect } from "@tanstack/react-router";
import { localizedHead } from "@/lib/seo";
import { EzyAiPage } from "../ezyai";
import { EZYAI_BOARD_VISIBLE } from "@/lib/ezyai/visibility";

export const Route = createFileRoute("/ms/ezyai")({
  // Hidden with its English twin, and sent to the Malay home page rather than
  // the English one so a visitor is not switched languages by a redirect.
  beforeLoad: () => {
    if (!EZYAI_BOARD_VISIBLE) throw redirect({ to: "/ms" });
  },
  head: () =>
    localizedHead({
      path: "/ezyai",
      locale: "ms",
      title: "EzyAI — Isyarat Dagangan AI di Telegram | EzyMap Algo",
      description:
        "EzyAI menukar data pasaran percuma menjadi keyakinan dagangan di Telegram — analisis teknikal, amaran tontonan langsung, asas dan isyarat autopilot, percuma untuk mula.",
      ogDescription:
        "Analisis atas permintaan, amaran langsung, asas dan isyarat autopilot — percuma untuk mula.",
      image: "default",
      crumbName: "EzyAI",
    }),
  component: EzyAiPage,
});
