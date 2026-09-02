import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import { getCheckoutStatus } from "@/lib/checkout.functions";
import { getCatalogItem } from "@/lib/catalog";

export const Route = createFileRoute("/checkout-success")({
  head: () => ({
    meta: [
      { title: "Payment complete — EzyMap ALGO" },
      {
        name: "description",
        content: "Your EzyMap ALGO purchase is confirmed. Activate access in the Telegram bot.",
      },
      { property: "og:title", content: "Payment complete — EzyMap ALGO" },
      { property: "og:description", content: "Your EzyMap ALGO purchase is confirmed." },
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
      })
      .catch(() => setState("pending"));
  }, [check]);

  const item = product ? getCatalogItem(product) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        {state === "loading" ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted" />
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
              {state === "paid" ? "Payment confirmed" : "Thanks — we're confirming your payment"}
            </h1>
            <p className="mt-3 text-body">
              {item ? `${item.name} (${item.term}) is ready to activate. ` : ""}
              Open the Telegram bot and send <span className="text-foreground">/start</span> to
              unlock your access. If it is not active within a few minutes, message Sarah.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={LINKS.register}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Send className="h-4 w-4" /> Activate in Telegram
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-body hover:text-primary"
              >
                Back to pricing
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
