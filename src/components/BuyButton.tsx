import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createCheckout } from "@/lib/checkout.functions";
import { track } from "@/lib/analytics";

type Props = {
  sku: string;
  label?: string;
  variant?: "primary" | "gold";
  className?: string;
};

export function BuyButton({ sku, label = "Checkout", variant = "primary", className = "" }: Props) {
  const startCheckout = useServerFn(createCheckout);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles =
    variant === "gold"
      ? "border border-[rgba(201,161,58,0.45)] text-accent hover:bg-accent/10"
      : "bg-primary text-primary-foreground hover:opacity-90";

  async function go() {
    setLoading(true);
    setError(null);
    try {
      track("checkout_start", { sku });
      const res = await startCheckout({ data: { sku, origin: window.location.origin } });
      if (res?.url) window.location.href = res.url;
      else setError("Checkout unavailable, please try again.");
    } catch {
      setError("Checkout unavailable, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${styles}`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {label}
      </button>
      {error ? <p className="mt-2 text-xs text-[#d9534f]">{error}</p> : null}
    </div>
  );
}
