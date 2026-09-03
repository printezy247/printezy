import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CreditCard, LogIn, Send } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { supabase } from "@/integrations/supabase/client";
import { getMyTelegramLinkStatus } from "@/lib/telegram-link.functions";
import { track } from "@/lib/analytics";

type Props = {
  sku: string;
  label?: string;
  variant?: "primary" | "gold";
  className?: string;
};

type GateState = "loading" | "signed_out" | "not_linked" | "ready";

export function BuyButton({ sku, label = "Checkout", variant = "primary", className = "" }: Props) {
  const navigate = useNavigate();
  const getStatus = useServerFn(getMyTelegramLinkStatus);
  const [gate, setGate] = useState<GateState>("loading");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (!data.session) {
        setGate("signed_out");
        return;
      }
      try {
        const status = await getStatus({ data: undefined });
        if (active) setGate(status.linked ? "ready" : "not_linked");
      } catch {
        if (active) setGate("not_linked");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const styles =
    variant === "gold"
      ? "border border-[rgba(201,161,58,0.45)] text-accent hover:bg-accent/10"
      : "bg-primary text-primary-foreground hover:opacity-90";
  const buttonClass = `inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${styles}`;
  const currentPath = () => (typeof window !== "undefined" ? window.location.pathname : "/");

  if (gate === "loading") {
    return (
      <div className={className}>
        <button type="button" disabled className={buttonClass}>
          <Loader2 className="h-4 w-4 animate-spin" />
        </button>
      </div>
    );
  }

  if (gate === "signed_out") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => void navigate({ to: "/auth", search: { redirect: currentPath() } })}
          className={buttonClass}
        >
          <LogIn className="h-4 w-4" /> Sign in to buy
        </button>
        <p className="mt-2 text-xs text-muted">
          Free account, one click with Google — access is delivered on Telegram.
        </p>
      </div>
    );
  }

  if (gate === "not_linked") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => void navigate({ to: "/link-telegram" })}
          className={buttonClass}
        >
          <Send className="h-4 w-4" /> Connect Telegram to buy
        </button>
        <p className="mt-2 text-xs text-muted">One-time step, then you're set for every purchase.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => {
          track("click", `checkout_${sku}`);
          setOpen(true);
        }}
        className={buttonClass}
      >
        <CreditCard className="h-4 w-4" />
        {label}
      </button>
      {open ? <StripeEmbeddedCheckout sku={sku} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
