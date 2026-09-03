import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Nav, Footer } from "@/components/landing/Landing";
import { getCheckoutStatus } from "@/lib/checkout.functions";
import { getCatalogItem, formatUsd } from "@/lib/catalog";
import { REGISTER_BOT, botStartLink } from "@/lib/telegram-links";

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
  const [state, setState] = useState<"loading" | "paid" | "pending">("loading");
  const [product, setProduct] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);

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
      })
      .catch(() => setState("pending"));
  }, [check]);

  const item = product ? getCatalogItem(product) : undefined;

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
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
