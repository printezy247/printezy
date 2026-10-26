import { useEffect, useState } from "react";

import { getStoredConsent, isRegulatedRegion, setConsent } from "@/lib/consent";

/**
 * Consent banner for ad measurement. Renders only for visitors in regions
 * that require consent and who haven't decided yet. Declining is exactly as
 * easy as accepting, and the choice can be changed from the footer link.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    if (getStoredConsent()) return;
    isRegulatedRegion().then((regulated) => {
      if (active && regulated && !getStoredConsent()) setVisible(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!visible) return null;

  const decide = (value: "granted" | "denied") => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie and measurement consent"
      className="fixed inset-x-2 bottom-2 z-[60] mx-auto max-w-3xl rounded-xl border border-border bg-surface-elevated/95 px-3 py-2.5 shadow-lg backdrop-blur sm:inset-x-3 sm:bottom-3 sm:rounded-2xl sm:p-5 [@media(max-height:500px)]:max-w-xl [@media(max-height:500px)]:py-2 [@media(max-height:500px)]:sm:p-2.5"
    >
      <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
        <p className="text-[11.5px] leading-snug text-muted-foreground sm:text-sm [@media(max-height:500px)]:text-[11px]">
          We use measurement cookies to see which ads bring traders here.
          <span className="hidden sm:inline [@media(max-height:500px)]:hidden">
            {" "}
            Nothing is shared until you agree, and you can change your mind any time.
          </span>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm text-foreground transition-colors hover:bg-surface"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm text-primary-foreground transition-colors hover:bg-primary-glow"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
