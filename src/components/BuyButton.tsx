import { lazy, Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  className?: string;
};

export function BuyButton({ sku, label = "Checkout", variant = "primary", className = "" }: Props) {
  const [open, setOpen] = useState(false);

  function go() {
    track("click", `checkout_${sku}`);
    setOpen(true);
  }

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={go}
        variant={variant === "gold" ? "outline" : "primary"}
        className="w-full"
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
