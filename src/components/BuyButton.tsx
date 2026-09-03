import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CreditCard, LogIn } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PurchaseDetailsForm } from "@/components/PurchaseDetailsForm";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, type Profile } from "@/lib/profile.functions";
import { getCatalogItem } from "@/lib/catalog";
import { track } from "@/lib/analytics";

type Props = {
  sku: string;
  label?: string;
  variant?: "primary" | "gold";
  className?: string;
};

type Gate = "loading" | "signed_out" | "needs_details" | "ready";

export function BuyButton({ sku, label = "Checkout", variant = "primary", className = "" }: Props) {
  const navigate = useNavigate();
  const getProfile = useServerFn(getMyProfile);
  const [gate, setGate] = useState<Gate>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [openCheckout, setOpenCheckout] = useState(false);

  const item = getCatalogItem(sku);
  const requireMt5 = item?.group === "mt5";

  const evaluate = (p: Profile) =>
    p.telegramUsername && (!requireMt5 || p.mt5Account) ? "ready" : "needs_details";

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (!data.session) {
        setGate("signed_out");
        return;
      }
      try {
        const p = await getProfile({ data: undefined });
        if (!active) return;
        setProfile(p);
        setGate(evaluate(p));
      } catch {
        if (active) setGate("signed_out");
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles =
    variant === "gold"
      ? "border border-[rgba(201,161,58,0.45)] text-accent hover:bg-accent/10"
      : "bg-primary text-primary-foreground hover:opacity-90";
  const buttonClass = `inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${styles}`;
  const currentPath = () => (typeof window !== "undefined" ? window.location.pathname : "/");

  function go() {
    track("click", `checkout_${sku}`);
    if (gate === "needs_details") {
      setShowDetails(true);
    } else if (gate === "ready") {
      setOpenCheckout(true);
    }
  }

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
        <p className="mt-2 text-xs text-muted-foreground">Free account, one click with Google.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <button type="button" onClick={go} className={buttonClass}>
        <CreditCard className="h-4 w-4" />
        {label}
      </button>
      {showDetails && profile ? (
        <PurchaseDetailsForm
          profile={profile}
          requireMt5={!!requireMt5}
          onClose={() => setShowDetails(false)}
          onSaved={() => {
            setShowDetails(false);
            setGate("ready");
            setOpenCheckout(true);
          }}
        />
      ) : null}
      {openCheckout ? <StripeEmbeddedCheckout sku={sku} onClose={() => setOpenCheckout(false)} /> : null}
    </div>
  );
}
