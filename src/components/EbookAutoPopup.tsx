import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { EbookClaimModal } from "./EbookClaimModal";

const EXCLUDED_PREFIXES = ["/ebooks", "/auth", "/account", "/free-ebook"];
const TIMED_DELAY_MS = 45000;
const SESSION_KEY = "pe_ebook_popup_shown";

/**
 * Proactive "get the free ebook" popup — timed only, once per browser
 * session. Skipped on pages where a claim flow already exists or would
 * be redundant, and suppressed entirely while a checkout overlay is open.
 */
export function EbookAutoPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const excluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (excluded) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = window.setTimeout(() => {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      if (document.body.getAttribute("data-checkout-open") === "true") return;
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    }, TIMED_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [excluded]);

  if (!open || excluded) return null;
  return <EbookClaimModal slug="technical-analysis" onClose={() => setOpen(false)} />;
}
