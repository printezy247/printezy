import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send, Copy, Gift, Mail } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Nav, Footer } from "@/components/landing/Landing";
import { BuyButton } from "@/components/BuyButton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getCheckoutStatus } from "@/lib/checkout.functions";
import { getOrCreateReferralCode, getMyReferralStats, type ReferralStats } from "@/lib/referral.functions";
import { getCatalogItem, formatUsd, isEzyAiSku, type CatalogGroup } from "@/lib/catalog";
import { REGISTER_BOT, EZYAI_BOT, botStartLink, ezyAiStartLink } from "@/lib/telegram-links";
import { SITE_URL } from "@/lib/bot/tiers";

/** 1-2 complementary SKUs to surface after a purchase, by the group just bought. */
const CROSS_SELL: Record<CatalogGroup, string[]> = {
  package: ["macro_full_desk", "mt5_bundle_1m"],
  tradingview: ["macro_full_desk", "mt5_currency_strength_1m"],
  mt5: ["macro_full_desk", "signal_pro"],
  macro: ["mt5_bundle_1m", "signal_pro"],
  ezyai: ["macro_full_desk", "signal_pro"],
};

export const Route = createFileRoute("/checkout-success")({
  head: () => ({
    meta: [
      { title: "Payment complete — activate in Telegram | EzyMap ALGO" },
      {
        name: "description",
        content:
          "Your EzyMap ALGO purchase is confirmed. Open the EzyRegister bot in Telegram to receive your indicators, signals and ebooks.",
      },
      { property: "og:title", content: "Payment complete — activate in Telegram" },
      {
        property: "og:description",
        content: "Your EzyMap ALGO purchase is confirmed. Access is delivered in Telegram.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/checkout-success` },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const check = useServerFn(getCheckoutStatus);
  const getCode = useServerFn(getOrCreateReferralCode);
  const getStats = useServerFn(getMyReferralStats);
  const [state, setState] = useState<"loading" | "paid" | "pending">("loading");
  const [product, setProduct] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState<string | null>(null);
  const [signInState, setSignInState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setState("pending");
      return;
    }
    check({ data: { sessionId } })
      .then((res) => {
        setState(res.paid ? "paid" : "pending");
        setProduct(res.product);
        setHandle(res.telegramUsername);
        setEmail(res.email);
        setRedeemCode(res.redeemCode);
      })
      .catch(() => setState("pending"));
  }, [check]);

  async function loadReferralInfo() {
    try {
      const [{ code }, stats] = await Promise.all([
        getCode({ data: undefined }),
        getStats({ data: undefined }),
      ]);
      setReferralCode(code);
      setReferralStats(stats);
    } catch {
      // Referral block is a bonus, not critical — fail silently.
    }
  }

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
      void loadReferralInfo();
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void loadReferralInfo();
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMagicLink() {
    if (!email || signInState !== "idle") return;
    setSignInState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    setSignInState(error ? "idle" : "sent");
    if (error) toast.error("Could not send the sign-in link — try again.");
  }

  const referralLink =
    referralCode && typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${referralCode}`
      : null;

  const item = product ? getCatalogItem(product) : undefined;
  const ezyai = isEzyAiSku(product);
  const deliveryBot = ezyai ? EZYAI_BOT : REGISTER_BOT;
  const crossSell = item
    ? CROSS_SELL[item.group]
        .map((sku) => getCatalogItem(sku))
        .filter((i): i is NonNullable<typeof i> => !!i && i.sku !== item.sku)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        {state === "loading" ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-2xl text-foreground sm:text-3xl">
              {state === "paid" ? "Payment confirmed" : "Thanks — we're confirming your payment"}
            </h1>

            {item ? (
              <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-surface-elevated p-5 text-left">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">You purchased</p>
                <p className="mt-1 text-base font-semibold text-foreground">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.term} · <span className="font-mono tabular-nums">{formatUsd(item.amountCents)}</span>
                </p>
                {handle ? (
                  <p className="mt-3 border-t border-border pt-3 text-sm text-body">
                    Delivering to <span className="text-accent">@{handle}</span> on Telegram.
                  </p>
                ) : null}
              </div>
            ) : null}

            {ezyai && redeemCode ? (
              <div className="mx-auto mt-6 max-w-md rounded-xl border border-accent/40 bg-accent/5 p-5 text-left">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Your PRO code
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 select-all font-mono text-xl font-bold tracking-wider text-foreground">
                    {redeemCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(redeemCode);
                      toast.success("Code copied");
                    }}
                    aria-label="Copy PRO code"
                    className="shrink-0 rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-sm text-body">
                  Open <span className="text-foreground">{EZYAI_BOT}</span> and send{" "}
                  <code className="font-mono text-foreground">/redeem {redeemCode}</code>. Keep it —
                  it also appears on your Stripe receipt and under My account on this site.
                </p>
              </div>
            ) : null}

            <p className="mt-6 text-body">
              Access is delivered inside Telegram. Open the{" "}
              <span className="text-foreground">{deliveryBot}</span> bot and press{" "}
              <span className="text-foreground">Start</span> —{" "}
              {ezyai
                ? "PRO switches on for your Telegram account within a minute, or instantly with the code above."
                : "your channels, indicators and ebooks are unlocked there within a minute."}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href={ezyai ? ezyAiStartLink("paid") : botStartLink(product ? `paid_${product}` : "paid")}>
                  <Send className="h-4 w-4" /> Open Telegram & claim access
                </a>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/" hash="packages">
                  Back to pricing
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              {ezyai
                ? "Nothing after a few minutes? Send /redeem with your PRO code in the bot. Still stuck? Message Sarah and we'll unlock it manually."
                : "Nothing after a few minutes? Message Sarah in the bot with your Telegram username and we'll unlock it manually."}
            </p>

            {crossSell.length > 0 ? (
              <div className="mt-12 border-t border-border pt-8 text-left">
                <h2 className="text-center text-sm uppercase tracking-wide text-muted-foreground">
                  You might also like
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {crossSell.map((cs) => (
                    <div key={cs.sku} className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
                      <h3 className="text-sm font-semibold text-foreground">{cs.name}</h3>
                      <p className="mt-1 flex-1 text-xs text-muted-foreground">{cs.description}</p>
                      <p className="mt-3 font-mono text-lg font-bold tabular-nums text-foreground">
                        {formatUsd(cs.amountCents)}{" "}
                        <span className="font-sans text-xs font-normal text-muted-foreground">{cs.term}</span>
                      </p>
                      <BuyButton sku={cs.sku} label="Add this" className="mt-3" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {!referralCode && email ? (
              <div className="mt-12 border-t border-border pt-8 text-center">
                {signInState === "sent" ? (
                  <p className="text-sm text-body">
                    Check <span className="text-accent">{email}</span> for a sign-in link.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void sendMagicLink()}
                    disabled={signInState === "sending"}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    {signInState === "sending" ? "Sending…" : "Email me a sign-in link to view my account"}
                  </button>
                )}
              </div>
            ) : null}

            {referralLink ? (
              <div className="mt-12 border-t border-border pt-8 text-left">
                <h2 className="flex items-center justify-center gap-2 text-center text-sm uppercase tracking-wide text-muted-foreground">
                  <Gift className="h-4 w-4 text-accent" /> Refer a friend
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Share your link. When someone you referred buys, we'll reach out to reward you.
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <code className="flex-1 truncate text-xs text-body">{referralLink}</code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(referralLink);
                      toast.success("Link copied");
                    }}
                    aria-label="Copy referral link"
                    className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {referralStats ? (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">{referralStats.signups}</span> signed up ·{" "}
                    <span className="font-mono tabular-nums">{referralStats.purchases}</span> purchased
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
