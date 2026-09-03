import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send, Copy, Gift, Mail } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Nav, Footer } from "@/components/landing/Landing";
import { BuyButton } from "@/components/BuyButton";
import { supabase } from "@/integrations/supabase/client";
import { getCheckoutStatus } from "@/lib/checkout.functions";
import { getOrCreateReferralCode, getMyReferralStats, type ReferralStats } from "@/lib/referral.functions";
import { getCatalogItem, formatUsd, type CatalogGroup } from "@/lib/catalog";
import { REGISTER_BOT, botStartLink } from "@/lib/telegram-links";

/** 1-2 complementary SKUs to surface after a purchase, by the group just bought. */
const CROSS_SELL: Record<CatalogGroup, string[]> = {
  package: ["macro_full_desk", "mt5_bundle_1m"],
  tradingview: ["macro_full_desk", "mt5_currency_strength_1m"],
  mt5: ["macro_full_desk", "signal_pro"],
  macro: ["mt5_bundle_1m", "signal_pro"],
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
      { name: "twitter:card", content: "summary" },
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
            <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
              {state === "paid" ? "Payment confirmed" : "Thanks — we're confirming your payment"}
            </h1>

            {item ? (
              <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-surface-elevated p-5 text-left">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">You purchased</p>
                <p className="mt-1 text-base font-semibold text-foreground">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.term} · {formatUsd(item.amountCents)}
                </p>
                {handle ? (
                  <p className="mt-3 border-t border-border pt-3 text-sm text-body">
                    Delivering to <span className="text-accent">@{handle}</span> on Telegram.
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className="mt-6 text-body">
              Access is delivered inside Telegram. Open the{" "}
              <span className="text-foreground">{REGISTER_BOT}</span> bot and press{" "}
              <span className="text-foreground">Start</span> — your channels, indicators and ebooks
              are unlocked there within a minute.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={botStartLink(product ? `paid_${product}` : "paid")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Send className="h-4 w-4" /> Open Telegram & claim access
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-body hover:text-primary"
              >
                Back to pricing
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Nothing after a few minutes? Message Sarah in the bot with your Telegram username and
              we'll unlock it manually.
            </p>

            {crossSell.length > 0 ? (
              <div className="mt-12 border-t border-border pt-8 text-left">
                <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  You might also like
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {crossSell.map((cs) => (
                    <div key={cs.sku} className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
                      <h3 className="text-sm font-semibold text-foreground">{cs.name}</h3>
                      <p className="mt-1 flex-1 text-xs text-muted-foreground">{cs.description}</p>
                      <p className="mt-3 text-lg font-bold text-foreground">
                        {formatUsd(cs.amountCents)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">{cs.term}</span>
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
                <h2 className="flex items-center justify-center gap-2 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
                    {referralStats.signups} signed up · {referralStats.purchases} purchased
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
