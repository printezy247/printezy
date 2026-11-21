import { createFileRoute } from "@tanstack/react-router";
import { LinkHub } from "@/components/landing/LinkHub";
import { buildWelcomeFaqJsonLd } from "@/components/landing/welcome-data";
import { localizedHead } from "@/lib/seo";
import { getActiveMemberCount } from "@/lib/member-count.functions";
import { loadMemberCount } from "@/lib/member-count-loader";

const TITLE = "EzyMap ALGO: Free Trading Signals, Links & Tools";
const DESC =
  "Free trading signals on Telegram, the EzyMap ALGO site, a free trading platform and our broker partner: everything in one place.";

/**
 * FAQPage markup comes from the same FAQ the page renders, so it cannot drift
 * from the visible copy. No HowTo: Google stopped showing it in 2023. The `/`
 * page has no Malay twin (see docs/SEO-KNOWN-GAPS.md), hence twinPath: null.
 */
const HEAD = localizedHead({
  path: "/",
  locale: "en",
  title: TITLE,
  description: DESC,
  image: "welcome",
  twinPath: null,
  crumbName: "Links",
});

export const Route = createFileRoute("/")({
  head: () => ({
    ...HEAD,
    scripts: [...HEAD.scripts, { type: "application/ld+json", children: buildWelcomeFaqJsonLd() }],
  }),
  // Fetched on the server so the HTML and first paint carry the real count.
  loader: async () => ({
    members: await loadMemberCount(() => getActiveMemberCount({ data: undefined }), 1500, 640),
  }),
  component: LinkHubRoute,
});

function LinkHubRoute() {
  const { members } = Route.useLoaderData();
  return <LinkHub initialMembers={members} />;
}
