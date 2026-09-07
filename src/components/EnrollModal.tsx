import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ModalPortal";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { createCheckout } from "@/lib/checkout.functions";
import { getStoredReferralCode } from "@/lib/referral-capture";
import { getSessionId } from "@/lib/analytics";
import { getCatalogItem } from "@/lib/catalog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  sku: string;
  onClose: () => void;
  /**
   * Open the details step inside the card the button lives in, rather than as
   * a centred overlay. The card must be `relative`; the panel covers it. The
   * Stripe step always goes centred — a card column is too narrow for it.
   */
  inline?: boolean;
};
type Step = "details" | "checkout";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

/**
 * The tier card IS the checkout: one overlay, details step flows straight
 * into the Stripe step inside the same dialog — no modal stacked on a
 * modal. Guest checkout — no account required up front.
 */
export function EnrollModal({ sku, onClose, inline = false }: Props) {
  const item = getCatalogItem(sku);
  const requireMt5 = item?.group === "mt5";
  const checkout = useServerFn(createCheckout);
  const reducedMotion = usePrefersReducedMotion();

  const [step, setStep] = useState<Step>("details");
  // Only the details step sits in the card; payment needs the full width.
  const inCard = inline && step === "details";
  const [fullName, setFullName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [mt5Account, setMt5Account] = useState("");
  const [pulse, setPulse] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const handle = telegramUsername.trim().replace(/^@+/, "");
  const ready = /^[A-Za-z0-9_]{5,32}$/.test(handle) && (!requireMt5 || mt5Account.trim().length > 0);

  // Body scroll lock while the dialog is open, and a signal other
  // proactive popups (e.g. EbookAutoPopup) check to stay suppressed.
  useEffect(() => {
    document.body.setAttribute("data-checkout-open", "true");
    // An in-card panel leaves the rest of the page visible and usable, so
    // freezing the scroll would only strand the reader.
    const prev = document.body.style.overflow;
    if (!inCard) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.body.removeAttribute("data-checkout-open");
    };
  }, [inCard]);

  // Focus trap + Escape to close; focus returns to the trigger on close via onClose.
  useEffect(() => {
    closeBtnRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) {
      setPulse((p) => p + 1);
      return;
    }
    setCheckoutLoading(true);
    setStep("checkout");
  }

  const fetchClientSecret = async (): Promise<string> => {
    try {
      const referredBy = getStoredReferralCode();
      const result = await checkout({
        data: {
          sku,
          origin: window.location.origin,
          environment: getStripeEnvironment(),
          telegramUsername: handle,
          sessionId: getSessionId(),
          ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
          ...(experienceLevel ? { experienceLevel } : {}),
          ...(mt5Account.trim() ? { mt5Account: mt5Account.trim() } : {}),
          ...(referredBy ? { referredBy } : {}),
        },
      });
      if ("error" in result) throw new Error(result.error);
      if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
      return result.clientSecret;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Could not start checkout.");
      throw err;
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!item) return null;

  const closeButton = (
    <button
      ref={closeBtnRef}
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
    >
      <X className="h-5 w-5" />
    </button>
  );

  const detailsBody = (
    <>
          <>
            <h2 className="pr-8 text-lg text-foreground">{item.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Access is delivered to this Telegram account.
            </p>

            <form onSubmit={submitDetails} className="mt-5 flex flex-col gap-3">
              <label className="text-sm text-muted-foreground">Telegram username</label>
              <input
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="your_telegram"
                autoComplete="off"
                spellCheck={false}
                className={inputClass}
              />

              {requireMt5 ? (
                <>
                  <label className="text-sm text-muted-foreground">MT5 account number</label>
                  <input
                    value={mt5Account}
                    onChange={(e) => setMt5Account(e.target.value.replace(/\D/g, ""))}
                    placeholder="12345678"
                    inputMode="numeric"
                    className={inputClass}
                  />
                </>
              ) : null}

              <label className="text-sm text-muted-foreground">Full name (optional)</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />

              <label className="text-sm text-muted-foreground">Trading experience (optional)</label>
              <Select
                value={experienceLevel || "unspecified"}
                onValueChange={(v) => setExperienceLevel(v === "unspecified" ? "" : v)}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">Prefer not to say</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" disabled={!ready} className="mt-2 w-full">
                Continue
              </Button>
            </form>
          </>
    </>
  );

  // The details step, drawn over the card it was opened from: the card's own
  // copy fades out behind it and the form takes its place in the grid.
  if (inCard) {
    return (
      <motion.div
        key="inline"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: reducedMotion ? 0 : 0.18 } }}
        exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.12 } }}
        className="absolute inset-0 z-40 flex items-center justify-center bg-background/95 p-3"
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Purchase details"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{
            opacity: 1,
            scale: !reducedMotion && pulse ? [1, 1.02, 1] : 1,
            transition: { duration: reducedMotion ? 0 : 0.18, ease: "easeOut" },
          }}
          className="relative max-h-full w-full overflow-y-auto rounded-xl border border-primary/25 bg-background p-4 shadow-elevated"
        >
          <div className="bg-green absolute inset-x-0 top-0 h-[3px]" aria-hidden="true" />
          {closeButton}
          {detailsBody}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <ModalPortal>
      <motion.div
        key="overlay"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: reducedMotion ? 0 : 0.2 } }}
        exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.15 } }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={dialogRef}
          key="panel"
          role="dialog"
          aria-modal="true"
          aria-label={step === "details" ? "Purchase details" : "Payment"}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
          animate={{
            opacity: 1,
            scale: !reducedMotion && pulse ? [1, 1.02, 1] : 1,
            y: 0,
            transition: { duration: reducedMotion ? 0 : 0.2, ease: "easeOut" },
          }}
          exit={{
            opacity: 0,
            scale: reducedMotion ? 1 : 0.96,
            y: reducedMotion ? 0 : 8,
            transition: { duration: reducedMotion ? 0 : 0.15, ease: "easeIn" },
          }}
          onClick={(e) => e.stopPropagation()}
          className={`relative my-8 w-full overflow-hidden rounded-xl border border-primary/25 bg-background shadow-elevated ${
            step === "details" ? "max-w-md p-6" : "max-w-lg"
          }`}
        >
          <div className="bg-green absolute inset-x-0 top-0 h-[3px]" aria-hidden="true" />
          {closeButton}

          {step === "details" ? (
            detailsBody
          ) : (
          <div className="relative min-h-[280px]">
            {checkoutError ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <p className="text-sm text-destructive">{checkoutError}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCheckoutError(null);
                    setStep("details");
                  }}
                >
                  Back
                </Button>
              </div>
            ) : (
              <>
                {checkoutLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : null}
                <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </>
            )}
          </div>
          )}
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}
