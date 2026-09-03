import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Nav, Footer } from "@/components/landing/Landing";
import { getCheckoutStatus } from "@/lib/checkout.functions";
import { getCatalogItem, formatUsd } from "@/lib/catalog";
import { REGISTER_BOT } from "@/lib/telegram-links";

export const Route = createFileRoute("/checkout-success")({
  head: () => ({
    meta: [
      { title: "Payment complete — activate in Telegram | EzyMap ALGO" },
      {
        name: "description",
        content:
          "Your EzyMap ALGO purchase is confirmed. Use your one-time claim code in the EzyRegister bot to unlock indicators, signals and ebooks.",
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
  const [state, setState] = useState<"loading" | "paid" | "pending">("loading");
  const [product, setProduct] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        setEmail(res.email);
        setClaimCode(res.claimCode);
      })
      .catch(() => setState("pending"));
  }, [check]);

  const item = product ? getCatalogItem(product) : undefined;
  const connectUrl = claimCode
    ? `https://t.me/${REGISTER_BOT.replace(/^@/, "")}?start=${claimCode}`
    : `https://t.me/${REGISTER_BOT.replace(/^@/, "")}`;

  async function copyCode() {
    if (!claimCode) return;
    try {
      await navigator.clipboard.writeText(claimCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        {state === "loading" ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted" />
        ) : (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
              {state === "paid" ? "Payment confirmed" : "Thanks — we're confirming your payment"}
            </h1>

            {item ? (
              <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-elevated p-5 text-left">
                <p className="text-xs uppercase tracking-wide text-muted">You purchased</p>
                <p className="mt-1 text-base font-semibold text-foreground">{item.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {item.term} · {formatUsd(item.amountCents)}
                </p>
                {email ? (
                  <p className="mt-3 border-t border-border pt-3 text-sm text-body">
                    Receipt sent to <span className="text-accent">{email}</span>
                  </p>
                ) : null}
              </div>
            ) : null}

            {claimCode ? (
              <div className="mx-auto mt-6 max-w-md rounded-xl border border-[rgba(201,161,58,0.45)] bg-elevated p-5">
                <p className="text-xs uppercase tracking-wide text-muted">Your one-time claim code</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <code className="text-xl font-bold tracking-widest text-accent">{claimCode}</code>
                  <button
                    type="button"
                    onClick={copyCode}
                    aria-label="Copy claim code"
                    className="rounded-md border border-border p-1.5 text-muted hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {copied ? "Copied." : "Keep this — it links your purchase to your Telegram account."}
                </p>
              </div>
            ) : null}

            <p className="mt-6 text-body">
              Press the button below and Telegram sends the code for you — no typing, no username to
              get wrong. Your channels, indicators and ebooks unlock within a minute.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={connectUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Send className="h-4 w-4" /> Connect Telegram & claim access
              </a>
              <Link
                to="/my-account"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-body hover:text-primary"
              >
                My account
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted">
              No Telegram yet? Your purchase is safe — sign in to <span className="text-foreground">My account</span>{" "}
              anytime with the email above and claim it later.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
