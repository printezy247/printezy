import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CreditCard } from "lucide-react";
import { EnrollModal } from "@/components/EnrollModal";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

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
        {open ? <EnrollModal sku={sku} onClose={() => setOpen(false)} /> : null}
      </AnimatePresence>
    </div>
  );
}
