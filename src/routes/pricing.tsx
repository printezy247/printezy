import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ShieldCheck, Send } from "lucide-react";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import { TelegramBuyButton, MacroSubscribeButton } from "@/components/TelegramBuyButton";
import { formatUsd, itemsByGroup, type CatalogItem } from "@/lib/catalog";
import { trackPageLoad } from "@/lib/analytics";
import { lifetimePayload, mt5Payload, type Mt5Term } from "@/lib/telegram-links";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — EzyMap ALGO Packages, Indicators & Macro Desk" },
      {
        name: "description",
        content:
          "Transparent pricing for EzyMap ALGO signal packages, TradingView and MT5 indicators, and macro desk subscriptions. Delivered in Telegram.",
      },
      { property: "og:title", content: "EzyMap ALGO Pricing" },
      {
        property: "og:description",
        content:
          "Lifetime signal packages from $29, TradingView and MT5 indicators, and macro desk products from $9/mo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

function CardShell({
  badge,
  name,
  description,
  price,
  term,
  bullets,
  children,
  extra,
}: {
  badge?: string;
  name: string;
  description: string;
  price: string;
  term: string;
  bullets: string[];
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-elevated p-5">
      {badge ? (
        <span className="mb-3 inline-flex w-fit rounded-md border border-[rgba(201,161,58,0.45)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
          {badge}
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{name}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>

      {extra}

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{price}</span>
        <span className="text-xs uppercase tracking-wide text-muted">{term}</span>
      </div>

      <ul className="mt-4 flex-1 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-body">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function LifetimeCard({ item }: { item: CatalogItem }) {
  return (
    <CardShell
      badge={item.badge}
      name={item.name}
      description={item.description}
      price={formatUsd(item.amountCents)}
      term={item.term}
      bullets={item.bullets}
    >
      <TelegramBuyButton
        payload={lifetimePayload(item.sku)}
        variant={item.badge ? "gold" : "primary"}
      />
    </CardShell>
  );
}

function MacroCard({ item }: { item: CatalogItem }) {
  return (
    <CardShell
      badge={item.badge}
      name={item.name}
      description={item.description}
      price={`${formatUsd(item.amountCents)}/mo`}
      term="Monthly"
      bullets={item.bullets}
    >
      <MacroSubscribeButton />
    </CardShell>
  );
}

/* ------------------------------ MT5 cards ---------------------------- */

const MT5_TERMS: { code: Mt5Term; label: string; suffix: string }[] = [
  { code: "1m", label: "1 month", suffix: "_1m" },
  { code: "6m", label: "6 months", suffix: "_6m" },
  { code: "1y", label: "1 year", suffix: "_1y" },
];

type Mt5Product = {
  /** Payload base, e.g. mt5_bundle */
  base: string;
  name: string;
  description: string;
  bullets: string[];
  badge?: string;
  prices: Record<Mt5Term, number>;
};

function buildMt5Products(): Mt5Product[] {
  const items = itemsByGroup("mt5");
  const bases: string[] = [];
  for (const item of items) {
    const base = item.sku.replace(/_(1m|6m|1y)$/, "");
    if (!bases.includes(base)) bases.push(base);
  }
  return bases.map((base) => {
    const byTerm = (t: Mt5Term) => items.find((i) => i.sku === `${base}_${t}`)!;
    const one = byTerm("1m");
    return {
      base,
      name: one.name.replace(/\s*[—(]\s*(1 Month|BONUS Layer Close \(1 Month\))\)?$/i, "").trim(),
      description: one.description,
      bullets: one.bullets,
      badge: one.badge,
      prices: {
        "1m": byTerm("1m").amountCents,
        "6m": byTerm("6m").amountCents,
        "1y": byTerm("1y").amountCents,
      },
    };
  });
}

function Mt5Card({ product }: { product: Mt5Product }) {
  const [term, setTerm] = useState<Mt5Term>("1m");
  const active = MT5_TERMS.find((t) => t.code === term)!;

  return (
    <CardShell
      badge={product.badge}
      name={product.name}
      description={product.description}
      price={formatUsd(product.prices[term])}
      term={active.label}
      bullets={product.bullets}
      extra={
        <div
          role="group"
          aria-label={`${product.name} licence term`}
          className="mt-4 grid grid-cols-3 gap-1 rounded-lg border border-border bg-[#0a0c0b] p-1"
        >
          {MT5_TERMS.map((t) => (
            <button
              key={t.code}
              type="button"
              aria-pressed={term === t.code}
              onClick={() => setTerm(t.code)}
              className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                term === t.code
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      <TelegramBuyButton
        payload={mt5Payload(product.base, term)}
        variant={product.badge ? "gold" : "primary"}
      />
    </CardShell>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  subtitle,
  cols = "sm:grid-cols-2 lg:grid-cols-4",
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  cols?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p>
      <div className={`mt-6 grid grid-cols-1 gap-4 ${cols}`}>{children}</div>
    </section>
  );
}

function PricingPage() {
  useEffect(() => {
    trackPageLoad("pricing");
  }, []);

  const mt5 = buildMt5Products();

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Pricing</h1>
          <p className="mt-3 max-w-2xl text-body">
            Every EzyMap ALGO product with its real price. Checkout and access both happen inside
            Telegram — pay by card, USDT or Telegram Stars and your access unlocks instantly.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 text-primary" /> Prices in USD.
          </p>
        </section>

        <Section
          id="packages"
          title="Signal packages"
          subtitle="Private signal channels, indicators and education, bundled by level. One-time payment, lifetime access."
        >
          {itemsByGroup("package").map((item) => (
            <LifetimeCard key={item.sku} item={item} />
          ))}
        </Section>

        <Section
          id="tradingview"
          title="TradingView indicators"
          subtitle="One-time licences for the EzyMap overlay on TradingView."
          cols="sm:grid-cols-2"
        >
          {itemsByGroup("tradingview").map((item) => (
            <LifetimeCard key={item.sku} item={item} />
          ))}
        </Section>

        <Section
          id="mt5"
          title="MT5 indicators"
          subtitle="Licence the full bundle or single tools — switch between 1 month, 6 months or 1 year."
          cols="sm:grid-cols-2 lg:grid-cols-3"
        >
          {mt5.map((p) => (
            <Mt5Card key={p.base} product={p} />
          ))}
        </Section>

        <Section
          id="macro"
          title="Macro desk subscriptions"
          subtitle="Monthly products delivered in the MacroTrader bot. Telegram Stars or USDT."
          cols="sm:grid-cols-2 lg:grid-cols-3"
        >
          {itemsByGroup("macro").map((item) => (
            <MacroCard key={item.sku} item={item} />
          ))}
        </Section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-border bg-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground">Not sure which to pick?</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Ask Sarah on Telegram — she will match a package to your account size, session and
              risk profile.
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
