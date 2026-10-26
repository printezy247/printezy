import { createFileRoute } from "@tanstack/react-router";
import { Welcome } from "@/components/landing/Welcome";
import { STEPS, FAQ } from "@/components/landing/welcome-data";
import { localizedHead } from "@/lib/seo";

const TITLE = "Never Miss a Trade Setup — Free Signals on Telegram | EzyMap ALGO";
const DESC =
  "Get live trading alerts with entry, stop and targets sent straight to your phone. Join 640+ traders in the free EzyMap Telegram channel. No card needed.";

/**
 * HowTo + FAQPage generated from the same STEPS and FAQ the page renders, so
 * the schema can never drift from the visible copy. The `/` page has no Malay
 * twin (see docs/SEO-KNOWN-GAPS.md), hence msPath: null.
 */
const HOWTO_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to get EzyMap ALGO trading alerts",
  description: "Join the free Telegram channel and receive a full trade plan as each setup forms.",
  step: STEPS.map((s) => ({
    "@type": "HowToStep",
    position: Number(s.n),
    name: s.title,
    text: s.body,
  })),
});

const FAQ_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

const HEAD = localizedHead({
  path: "/",
  locale: "en",
  title: TITLE,
  description: DESC,
  image: "welcome",
  twinPath: null,
  crumbName: "Free Telegram signals",
});

export const Route = createFileRoute("/")({
  head: () => ({
    ...HEAD,
    scripts: [
      ...HEAD.scripts,
      { type: "application/ld+json", children: HOWTO_JSON_LD },
      { type: "application/ld+json", children: FAQ_JSON_LD },
    ],
  }),
  component: Welcome,
});
