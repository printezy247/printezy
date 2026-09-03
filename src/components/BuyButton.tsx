import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { track } from "@/lib/analytics";

type Props = {
  sku: string;
  label?: string;
  variant?: "primary" | "gold";
  className?: string;
};

export function BuyButton({ sku, label = "Checkout", variant = "primary", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  const handle = username.replace(/^@+/, "").trim();
  const ready = handle.length > 0;

  const styles =
    variant === "gold"
      ? "border border-[rgba(201,161,58,0.45)] text-accent hover:bg-accent/10"
      : "bg-primary text-primary-foreground hover:opacity-90";

  function go() {
    track("click", `checkout_${sku}`);
    setError(null);
    setOpen(true);
  }

  return (
    <div className={className}>
      <label className="mb-2 flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2">
        <span className="text-sm text-muted">@</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your Telegram username"
          autoComplete="off"
          spellCheck={false}
          aria-label="Telegram username"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />
      </label>
      <button
        type="button"
        onClick={go}
        disabled={!ready}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${styles}`}
      >
        <CreditCard className="h-4 w-4" />
        {label}
      </button>
      {error ? <p className="mt-2 text-xs text-[#d9534f]">{error}</p> : null}
      {!ready && !error ? (
        <p className="mt-2 text-xs text-muted">Telegram username required — access is delivered there.</p>
      ) : null}
      {open ? (
        <StripeEmbeddedCheckout
          sku={sku}
          telegramUsername={handle}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
