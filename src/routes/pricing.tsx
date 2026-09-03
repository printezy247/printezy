import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Packages, TradingView and MT5 sections now live on the landing page's
 * single decision spine. This route stays (ads and internal links use
 * /pricing#sku anchors) but only redirects — hash fragments never reach
 * the server, so the redirect has to happen client-side to preserve them.
 */
export const Route = createFileRoute("/pricing")({
  component: PricingRedirect,
});

function PricingRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    window.location.replace(`/${hash || "#packages"}`);
  }, []);
  return null;
}
