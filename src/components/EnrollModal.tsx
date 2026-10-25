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

/** What the checkout server accepts: a Telegram username, no leading @. */
const HANDLE_RE = /^[A-Za-z0-9_]{5,32}$/;

/**
 * Infrastructure failures are ours, not the buyer's. Showing them the
 * variable name (or the words "Lovable Cloud") is a dead end they cannot act
 * on, so those become one sentence they can act on: try again shortly.
 */
const INFRA_ERROR_RE =
  /(supabase|environment variable|service[_ ]?role|anon key|not configured|placeholder|missing .{0,40}key|econnrefused|failed to fetch|fetch failed|network ?error)/i;

function checkoutUserMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  if (INFRA_ERROR_RE.test(raw)) {
    return "Checkout is temporarily unavailable. Please try again in a few minutes.";
  }
  // The checkout server already phrases its own refusals (rate limit, payment
  // mismatch) and Stripe's declines for customers; anything else short and
  // human goes through unchanged, and a long or empty message does not.
  const clean = raw.replace(/\s+/g, " ").trim();
  if (!clean || clean.length > 200) {
    return "We couldn't start checkout. Please try again.";
  }
  return clean;
}

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
  // Bumped by "Try again": remounting the provider is what re-asks for a
  // client secret without closing the dialog.
  const [checkoutAttempt, setCheckoutAttempt] = useState(0);
  // Validation is only shown once the buyer has tried to continue, so an
  // untouched form never opens with red text.
  const [attempted, setAttempted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const telegramRef = useRef<HTMLInputElement>(null);
  const mt5Ref = useRef<HTMLInputElement>(null);

  const handle = telegramUsername.trim().replace(/^@+/, "");
  const handleOk = HANDLE_RE.test(handle);
  const mt5Ok = !requireMt5 || mt5Account.trim().length > 0;
  const showHandleError = attempted && !handleOk;
  const showMt5Error = attempted && !mt5Ok;

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

  // The TradingView and MT5 cards are shorter than this form, so the panel has
  // to spill past them. Sibling cards would paint over that spill the moment
  // the pointer sits on this one, because .card-lift's transform turns the
  // hovered card into its own stacking context and traps the panel inside it.
  // Raising the whole card for as long as the form is open settles the order
  // regardless of where the pointer happens to be.
  useEffect(() => {
    if (!inCard) return;
    const card = dialogRef.current?.closest<HTMLElement>("article");
    if (!card) return;
    const prevZ = card.style.zIndex;
    const prevPos = card.style.position;
    card.style.zIndex = "40";
    if (getComputedStyle(card).position === "static") card.style.position = "relative";
    return () => {
      card.style.zIndex = prevZ;
      card.style.position = prevPos;
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
    if (checkoutLoading) return;
    setAttempted(true);
    if (!handleOk) {
      setPulse((p) => p + 1);
      telegramRef.current?.focus();
      return;
    }
    if (!mt5Ok) {
      setPulse((p) => p + 1);
      mt5Ref.current?.focus();
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
      // The real cause is for us, in the console; the buyer gets a sentence
      // they can act on.
      console.error("[checkout] could not start", err);
      setCheckoutError(checkoutUserMessage(err));
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
                ref={telegramRef}
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="your_telegram"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={showHandleError}
                aria-describedby={
                  showHandleError
                    ? "enroll-telegram-hint enroll-telegram-error"
                    : "enroll-telegram-hint"
                }
                className={inputClass}
              />
              <p id="enroll-telegram-hint" className="-mt-1 text-xs text-muted-foreground">
                5–32 characters, letters, numbers or underscores — without the @
              </p>
              {showHandleError ? (
                <p id="enroll-telegram-error" role="alert" className="-mt-1 text-xs text-destructive">
                  Enter your Telegram username without the @ — 5 to 32 letters, numbers or
                  underscores.
                </p>
              ) : null}

              {requireMt5 ? (
                <>
                  <label className="text-sm text-muted-foreground">MT5 account number</label>
                  <input
                    ref={mt5Ref}
                    value={mt5Account}
                    onChange={(e) => setMt5Account(e.target.value.replace(/\D/g, ""))}
                    placeholder="12345678"
                    inputMode="numeric"
                    aria-invalid={showMt5Error}
                    aria-describedby={showMt5Error ? "enroll-mt5-error" : undefined}
                    className={inputClass}
                  />
                  {showMt5Error ? (
                    <p id="enroll-mt5-error" role="alert" className="text-xs text-destructive">
                      Enter your MT5 account number.
                    </p>
                  ) : null}
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

              <Button type="submit" disabled={checkoutLoading} className="mt-2 w-full">
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
        className="absolute inset-0 z-40"
      >
        <div className="absolute inset-0 rounded-xl bg-background/95" aria-hidden="true" />
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
          className="absolute left-1/2 top-1/2 max-h-[85vh] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-primary/25 bg-background p-4 shadow-elevated"
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
                <p role="alert" className="text-sm text-destructive">
                  {checkoutError}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setCheckoutError(null);
                      setCheckoutAttempt((n) => n + 1);
                    }}
                  >
                    Try again
                  </Button>
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
              </div>
            ) : (
              <>
                {checkoutLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : null}
                <EmbeddedCheckoutProvider
                  key={checkoutAttempt}
                  stripe={getStripe()}
                  options={{ fetchClientSecret }}
                >
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
