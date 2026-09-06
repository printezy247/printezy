import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Packages, TradingView and MT5 sections now live on the landing page's
 * single decision spine. This route stays (ads and internal links use
 * /pricing#sku anchors) but only redirects.
 *
 * A server-side redirect to "/" (no fragment in the Location header) still
 * lets the browser re-apply whatever fragment was on the original request
 * URL once it lands — standard browser behavior, since fragments never
 * reach the server in the first place. So this doesn't need to special-case
 * "hash present vs. not": a plain 301 to "/" preserves /pricing#sku as
 * /#sku for real visitors, while giving crawlers a real redirect instead of
 * a blank 200.
 */
export const Route = createFileRoute("/pricing")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
