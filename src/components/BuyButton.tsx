import { useState } from "react";
import { CreditCard } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { track } from "@/lib/analytics";

type Props = {
  sku: string;
  label?: string;
  variant?: "primary" | "gold";
  className?: string;
};

export function BuyButton({ sku, label = "Checkout", variant = "primary", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const { user } = useSupabaseUser();

  const styles =
    variant === "gold"
      ? "border border-[rgba(201,161,58,0.45)] text-accent hover:bg-accent/10"
      : "bg-primary text-primary-foreground hover:opacity-90";

  function go() {
    track("click", `checkout_${sku}`);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={go}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${styles} ${className}`}
      >
        <CreditCard className="h-4 w-4" />
        {label}
      </button>
      {open ? (
        <StripeEmbeddedCheckout
          sku={sku}
          userId={user?.id}
          email={user?.email ?? undefined}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
