import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

// Code-split: the Stripe Elements bindings this pulls in are only needed
// once someone actually opens checkout, not on every landing-page load.
const EnrollModal = lazy(() =>
  import("@/components/EnrollModal").then((m) => ({ default: m.EnrollModal })),
);

/**
 * Closers for whichever buy form is currently open. Each button used to keep
 * its open state entirely to itself, which went unnoticed while the form was a
 * centred overlay — two of them simply stacked. Now that the form sits inside
 * its card, two open at once read as a glitch, and on a phone the second one
 * is off screen entirely.
 */
const openForms = new Set<() => void>();

function useSoleOpenForm(): [boolean, (next: boolean) => void] {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    openForms.add(close);
    return () => {
      openForms.delete(close);
    };
  }, [open]);

  const set = useCallback((next: boolean) => {
    // Shut whatever else is open before taking its place.
    if (next) for (const close of [...openForms]) close();
    setOpen(next);
  }, []);

  return [open, set];
}

type Props = {
  sku: string;
  label?: string;
  variant?: "primary" | "gold";
  /** Compact by default; "md" for hero-sized placements. */
  size?: "sm" | "md";
  /** Centered, fixed-width button by default; "left" hugs the left edge; "stretch" fills the container. */
  align?: "center" | "left" | "stretch";
  /**
   * Open the details step inside the surrounding card instead of as a centred
   * overlay. Only for buttons sitting in a `relative` card tall enough to hold
   * the form — the pricing tiers. Payment still opens centred.
   */
  inlineForm?: boolean;
  className?: string;
};

export function BuyButton({
  sku,
  label = "Checkout",
  variant = "primary",
  size = "sm",
  align = "center",
  inlineForm = false,
  className = "",
}: Props) {
  const [open, setOpen] = useSoleOpenForm();

  function go() {
    track("click", `checkout_${sku}`);
    setOpen(true);
  }

  return (
    <div
      className={cn(
        align === "center" && "flex justify-center",
        align === "left" && "flex justify-start",
        className,
      )}
    >
      <Button
        type="button"
        onClick={go}
        variant={variant === "gold" ? "outline" : "primary"}
        size={size}
        // Marks a real buy call to action on the page. The mobile sticky bar
        // watches these and steps aside while one is on screen, so it never
        // covers the button a visitor is reaching for.
        data-buy-cta=""
        className={align === "stretch" ? "w-full" : "w-auto min-w-[168px]"}
      >
        <CreditCard className="h-4 w-4" />
        {label}
      </Button>
      <AnimatePresence>
        {open ? (
          <Suspense fallback={null}>
            <EnrollModal sku={sku} inline={inlineForm} onClose={() => setOpen(false)} />
          </Suspense>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
