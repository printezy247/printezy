import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check, ShieldCheck, Send } from "lucide-react";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import { BuyButton } from "@/components/BuyButton";
import { CATALOG, formatUsd, itemsByGroup, type CatalogItem } from "@/lib/catalog";
import { trackPageLoad } from "@/lib/analytics";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — EzyMap ALGO Packages, Indicators & Macro Desk" },
      {
        name: "description",
        content:
          "Transparent pricing for EzyMap ALGO signal packages, TradingView and MT5 indicators, and macro desk subscriptions. Secure card checkout.",
      },
      { property: "og:title", content: "EzyMap ALGO Pricing" },
      {
        property: "og:description",
        content:
          "Signal packages from $29, TradingView and MT5 indicators, and the Full Macro Desk from $19. Pay securely by card.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PriceCard({ item }: { item: CatalogItem }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-elevated p-5">
      {item.badge ? (
        <span className="mb-3 inline-flex w-fit rounded-md border border-[rgba(201,161,58,0.45)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
          {item.badge}
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
      <p className="mt-1 text-sm text-muted">{item.description}</p>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{formatUsd(item.amountCents)}</span>
        <span className="text-xs uppercase tracking-wide text-muted">{item.term}</span>
      </div>

      <ul className="mt-4 flex-1 space-y-2">
        {item.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-body">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <BuyButton
        sku={item.sku}
        label={`Checkout — ${formatUsd(item.amountCents)}`}
        variant={item.badge ? "gold" : "primary"}
        className="mt-5"
      />

      <a
        href={usdtBuyLink(item.sku)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => goTrack(`usdt_${item.sku}`)}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted transition-colors hover:text-primary"
      >
        <Send className="h-3.5 w-3.5" /> Pay with USDT in Telegram
      </a>
    </div>
  );
}

function Section({
  id,
  title,
  subtitle,
  items,
  cols = "sm:grid-cols-2 lg:grid-cols-4",
}: {
  id: string;
  title: string;
  subtitle: string;
  items: CatalogItem[];
  cols?: string;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p>
      <div className={`mt-6 grid grid-cols-1 gap-4 ${cols}`}>
        {items.map((item) => (
          <PriceCard key={item.sku} item={item} />
        ))}
      </div>
    </section>
  );
}

function PricingPage() {
  useEffect(() => {
    trackPageLoad("pricing");
  }, []);

  const canceled =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("canceled");

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pricing
          </h1>
          <p className="mt-3 max-w-2xl text-body">
            Every EzyMap ALGO product with its real price and a secure card checkout. Access is
            delivered through the Telegram bot right after payment.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 text-primary" /> Payments processed by Stripe. Prices in
            USD.
          </p>
          {canceled ? (
            <p className="mt-4 rounded-lg border border-border bg-elevated px-4 py-3 text-sm text-body">
              Checkout was canceled — nothing was charged. Pick a plan below to try again.
            </p>
          ) : null}
        </section>

        <Section
          id="packages"
          title="Signal packages"
          subtitle="Private signal channels, indicators and education, bundled by level."
          items={itemsByGroup("package")}
        />

        <Section
          id="tradingview"
          title="TradingView indicators"
          subtitle="One-time licences for the EzyMap overlay on TradingView."
          items={itemsByGroup("tradingview")}
          cols="sm:grid-cols-2"
        />

        <Section
          id="mt5"
          title="MT5 indicators"
          subtitle="Licence the full bundle or single tools, monthly, 6-monthly or yearly."
          items={itemsByGroup("mt5")}
          cols="sm:grid-cols-2 lg:grid-cols-3"
        />

        <Section
          id="macro"
          title="Macro desk subscriptions"
          subtitle="Premium heatmaps, sentiment and yield tools delivered in the MacroTrader bot."
          items={itemsByGroup("macro")}
          cols="sm:grid-cols-2 lg:grid-cols-3"
        />

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-border bg-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground">Not sure which to pick?</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Ask Sarah on Telegram — she will match a package to your account size, session and
              risk profile. {CATALOG.length} products available.
            </p>
            <a
              href={LINKS.support}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[rgba(201,161,58,0.45)] px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              <Send className="h-4 w-4" /> Ask Sarah
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
