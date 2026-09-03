import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { EbookClaimModal } from "./EbookClaimModal";

const EXCLUDED_PREFIXES = ["/ebooks", "/auth", "/account", "/free-ebook"];
const TIMED_DELAY_MS = 25000;
const SESSION_KEY = "pe_ebook_popup_shown";

/**
 * Proactive "get the free ebook" popup — timed + exit-intent, once per
 * browser session. Skipped on pages where a claim flow already exists or
 * would be redundant.
 */
export function EbookAutoPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const excluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (excluded) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const show = () => {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    };

    const timer = window.setTimeout(show, TIMED_DELAY_MS);
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show();
    };
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [excluded]);

  if (!open || excluded) return null;
  return <EbookClaimModal slug="technical-analysis" onClose={() => setOpen(false)} />;
}
