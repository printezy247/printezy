import { createFileRoute } from "@tanstack/react-router";
import { Welcome } from "@/components/landing/Welcome";
import { FAQ } from "@/components/landing/welcome-data";
import { localizedHead } from "@/lib/seo";
import { getActiveMemberCount } from "@/lib/member-count.functions";
import { loadMemberCount } from "@/lib/member-count-loader";

const TITLE = "Never Miss a Trade Setup — Free Signals on Telegram | EzyMap ALGO";
const DESC =
  "Get live trading alerts with entry, stop and targets sent straight to your phone. Join 640+ traders in the free EzyMap Telegram channel. No card needed.";

/**
 * FAQPage generated from the same FAQ the page renders, so the schema can
 * never drift from the visible copy. HowTo markup is gone on purpose: Google
 * stopped showing HowTo rich results in 2023. The `/` page has no Malay twin
 * (see docs/SEO-KNOWN-GAPS.md), hence twinPath: null.
 */
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
    scripts: [...HEAD.scripts, { type: "application/ld+json", children: FAQ_JSON_LD }],
  }),
  // Fetched on the server so the HTML and first paint carry the real count.
  loader: async () => ({
    members: await loadMemberCount(() => getActiveMemberCount({ data: undefined }), 1500, 640),
  }),
  component: WelcomeRoute,
});

function WelcomeRoute() {
  const { members } = Route.useLoaderData();
  return <Welcome initialMembers={members} />;
}
