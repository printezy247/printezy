import { lazy, Suspense, useState } from "react";
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

type Props = {
  sku: string;
  label?: string;
  variant?: "primary" | "gold";
  /** Compact by default; "md" for hero-sized placements. */
  size?: "sm" | "md";
  /** Centered, fixed-width button by default; "left" hugs the left edge; "stretch" fills the container. */
  align?: "center" | "left" | "stretch";
  className?: string;
};

export function BuyButton({
  sku,
  label = "Checkout",
  variant = "primary",
  size = "sm",
  align = "center",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);

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
        className={align === "stretch" ? "w-full" : "w-auto min-w-[168px]"}
      >
        <CreditCard className="h-4 w-4" />
        {label}
      </Button>
      <AnimatePresence>
        {open ? (
          <Suspense fallback={null}>
            <EnrollModal sku={sku} onClose={() => setOpen(false)} />
          </Suspense>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
