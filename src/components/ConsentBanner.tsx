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
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-border bg-surface-elevated/95 p-4 shadow-lg backdrop-blur sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use measurement cookies to see which ads bring traders here. Nothing is
          shared until you agree, and you can change your mind any time.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
