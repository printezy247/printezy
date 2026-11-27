import { createFileRoute } from "@tanstack/react-router";
import { LinkHub } from "@/components/landing/LinkHub";
import { localizedHead } from "@/lib/seo";
import { getActiveMemberCount } from "@/lib/member-count.functions";
import { loadMemberCount } from "@/lib/member-count-loader";

const TITLE = "EzyMap ALGO: Free Trading Signals, Links & Tools";
const DESC =
  "Find EzyMap ALGO’s free weekly trading class, Telegram signals channel, and TradingView referral link.";

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
  head: () => HEAD,
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
