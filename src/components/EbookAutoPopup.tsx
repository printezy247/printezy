import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";

// Code-split: this pulls in Supabase auth + the claim flow, only needed
// once the popup actually fires, not on every page load site-wide.
const EbookClaimModal = lazy(() =>
  import("./EbookClaimModal").then((m) => ({ default: m.EbookClaimModal })),
);

const EXCLUDED_PREFIXES = ["/ebooks", "/auth", "/account", "/dashboard", "/free-ebook"];
const TIMED_DELAY_MS = 45000;
const EXIT_DELAY_MS = 1200;
const SESSION_KEY = "pe_ebook_popup_shown";

/**
 * Proactive "get the free ebook" popup — timed only, once per browser
 * session. Skipped on pages where a claim flow already exists or would
 * be redundant, and suppressed entirely while a checkout overlay is open.
 */
export function EbookAutoPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const excluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (excluded) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const show = () => {
      if (openRef.current || sessionStorage.getItem(SESSION_KEY)) return;
      if (document.body.getAttribute("data-checkout-open") === "true") return;
      sessionStorage.setItem(SESSION_KEY, "1");
      openRef.current = true;
      setOpen(true);
    };
    const timer = window.setTimeout(show, TIMED_DELAY_MS);
    let exitTimer: number | undefined;
    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.relatedTarget !== null || event.clientY > 0)
        return;
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
      exitTimer = window.setTimeout(show, EXIT_DELAY_MS);
    };
    window.addEventListener("pointerout", onPointerOut);

    return () => {
      window.clearTimeout(timer);
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
      window.removeEventListener("pointerout", onPointerOut);
    };
  }, [excluded]);

  return (
    <AnimatePresence>
      {open && !excluded ? (
        <Suspense fallback={null}>
          <EbookClaimModal
            slug="technical-analysis"
            onClose={() => {
              openRef.current = false;
              setOpen(false);
            }}
          />
        </Suspense>
      ) : null}
    </AnimatePresence>
  );
}
