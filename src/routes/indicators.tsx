import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Check, Send, ShieldCheck, Zap } from "lucide-react";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import mt5LogoAsset from "@/assets/mt5-logo.png";
import { trackPageLoad, trackEngagement, goTrack } from "@/lib/analytics";
import { BuyButton } from "@/components/BuyButton";

const tradingViewLogo = "https://s3.tradingview.com/userpics/6171439-mFQX_big.png";
const mt5Logo = mt5LogoAsset;

type Plan = { label: string; price: string };
type Product = {
  id: string;
  name: string;
  tagline: string;
  bullets: string[];
  plans: Plan[];
  highlight?: string;
};

/** Prices mirror config/packages.json in the EzyMap bot repo. */
const TV_PRODUCTS: Product[] = [
  {
    id: "tv_lite",
    name: "TradingView — EzyMap Lite",
    tagline: "Entry-level mapping overlay for TradingView charts.",
    bullets: ["Auto support & resistance mapping", "Clean buy/sell bias arrows", "Works on any TradingView plan"],
    plans: [{ label: "One-time", price: "$49" }],
  },
  {
    id: "tv_pro",
    name: "TradingView — EzyMap Pro",
    tagline: "Full M1–H4 signal engine used in the Premium package.",
    bullets: ["M1–H4 entry, SL and TP signals", "Multi-timeframe confluence filter", "Lifetime updates included"],
    plans: [{ label: "One-time", price: "$249" }],
    highlight: "Most complete",
  },
];

const MT5_PRODUCTS: Product[] = [
  {
    id: "mt5_bundle",
    name: "MT5 Indicator Bundle",
    tagline: "Every MT5 tool below in one licence — worth $999.",
    bullets: ["All MT5 indicators included", "Priority setup help", "Prop-firm friendly settings"],
    plans: [
      { label: "1 Month", price: "$99" },
      { label: "6 Months", price: "$499" },
      { label: "1 Year", price: "$999" },
    ],
    highlight: "Best value",
  },
  {
    id: "mt5_bulk_close",
    name: "Bulk Close — BONUS Layer Close",
    tagline: "Close baskets or single layers of positions in one click.",
    bullets: ["One-click basket close", "Layer-by-layer partial close", "Hotkey panel on chart"],
    plans: [
      { label: "1 Month", price: "$19" },
      { label: "6 Months", price: "$109" },
      { label: "1 Year", price: "$199" },
    ],
    highlight: "Top selling",
  },
  {
    id: "mt5_drawdown_guardian",
    name: "Drawdown Guardian",
    tagline: "Hard-stop protection that keeps prop-firm rules intact.",
    bullets: ["Daily & total drawdown limits", "Auto flatten on breach", "Live risk readout on chart"],
    plans: [
      { label: "1 Month", price: "$9" },
      { label: "6 Months", price: "$49" },
      { label: "1 Year", price: "$99" },
    ],
    highlight: "Prop firm favorite",
  },
  {
    id: "mt5_auto_tpsl",
    name: "Auto TPSL",
    tagline: "Automatic take profit and stop loss on every fill.",
    bullets: ["Rule-based TP/SL placement", "Break-even & trailing modes", "Works with manual or EA trades"],
    plans: [
      { label: "1 Month", price: "$9" },
      { label: "6 Months", price: "$49" },
      { label: "1 Year", price: "$99" },
    ],
    highlight: "Trending this month",
  },
  {
    id: "mt5_currency_strength",
    name: "Currency Strength Meter",
    tagline: "See which currency is leading before you enter.",
    bullets: ["Real-time strength ranking", "Pair-by-pair comparison", "Included in the Pro package"],
    plans: [
      { label: "1 Month", price: "$9" },
      { label: "6 Months", price: "$49" },
      { label: "1 Year", price: "$99" },
    ],
  },
  {
    id: "mt5_mtf_bias",
    name: "MTF Bias",
    tagline: "Multi-timeframe direction bias in a single dashboard.",
    bullets: ["M1 to D1 bias grid", "Confluence scoring", "Alerts on bias flip"],
    plans: [
      { label: "1 Month", price: "$9" },
      { label: "6 Months", price: "$49" },
      { label: "1 Year", price: "$99" },
    ],
  },
];

const TERM_SUFFIX: Record<string, string> = {
  "1 Month": "_1m",
  "6 Months": "_6m",
  "1 Year": "_1y",
  "One-time": "",
};

function skuFor(productId: string, planLabel: string): string {
  return `${productId}${TERM_SUFFIX[planLabel] ?? ""}`;
}


function ProductCard({ product }: { product: Product }) {
  return (
    <article className="glass-card relative flex h-full flex-col rounded-xl p-6">
      {product.highlight ? (
        <span className="absolute right-4 top-4 rounded-full border border-[rgba(201,161,58,0.45)] bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
          {product.highlight}
        </span>
      ) : null}
      <h3 className="pr-24 text-lg font-semibold">{product.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{product.tagline}</p>

      <ul className="mt-4 space-y-2.5">
        {product.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex-1 space-y-2">
        {product.plans.map((p) => (
          <div key={p.label} className="flex items-center gap-2">
            <div className="flex flex-1 items-center justify-between rounded-lg border border-border bg-[#0a0c0b] px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{p.label}</span>
              <span className="text-sm font-semibold text-foreground">{p.price}</span>
            </div>
            <BuyButton sku={skuFor(product.id, p.label)} label="Buy" className="w-24 shrink-0" />
          </div>
        ))}
      </div>

      <a
        href={LINKS.bot}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => goTrack(`indicators_${product.id}_buy`)}
        className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-md border border-accent/60 bg-accent/5 px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
      >
        Get {product.name.split("—").pop()?.trim() ?? product.name} <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}

export const Route = createFileRoute("/indicators")({
  head: () => ({
    meta: [
      { title: "Indicators & Pricing — EzyMap Algo" },
      {
        name: "description",
        content:
          "EzyMap TradingView and MT5 indicators with real prices: EzyMap Lite $49, EzyMap Pro $249, MT5 bundle from $99/month and single tools from $9/month.",
      },
      { property: "og:title", content: "Indicators & Pricing — EzyMap Algo" },
      {
        property: "og:description",
        content:
          "TradingView and MT5 indicators from EzyMap Algo — Drawdown Guardian, Bulk Close, Auto TPSL, MTF Bias and more, with live pricing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndicatorsPage,
});

function IndicatorsPage() {
  useEffect(() => {
    trackPageLoad("indicators");
    const stop = trackEngagement();
    return stop;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" /> EzyMap indicator desk
          </span>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Indicators</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            The same TradingView and MT5 tools our members trade with — mapping, risk control and multi-timeframe bias.
            Prices below are the live prices used in the enrollment bot.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => goTrack("indicators_hero_bot")}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Send className="h-4 w-4" /> Get Your Indicator
            </a>
            <a
              href={LINKS.support}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => goTrack("indicators_hero_ask_sarah")}
              className="inline-flex items-center gap-2 rounded-md border border-[rgba(201,161,58,0.45)] px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              Ask Sarah
            </a>
          </div>
        </header>

        <section className="mt-12">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#0a0c0b] p-1.5">
              <img src={tradingViewLogo} alt="TradingView logo" loading="lazy" className="h-full w-full object-contain" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">TradingView Indicators</h2>
              <p className="text-sm text-muted-foreground">One-time licence, lifetime updates.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {TV_PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <a
            href={LINKS.tradingView}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => goTrack("indicators_tv_open_account")}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Open a free TradingView account <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </section>

        <section className="mt-14">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#f4f1ea] p-1.5">
              <img src={mt5Logo} alt="MetaTrader 5 logo" loading="lazy" className="h-full w-full object-contain" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">MT5 Indicators</h2>
              <p className="text-sm text-muted-foreground">Monthly, 6-month or yearly licences.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {MT5_PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <a
            href="https://www.metatrader5.com/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => goTrack("indicators_mt5_download")}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
          >
            Download MT5 Now <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </section>

        <section className="glass-card mt-14 rounded-xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold">Free access with a Vantage activation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Open an account under IB 26468008 and the indicators bundled with your package are unlocked at no extra
                cost — Lite on Beginner, Currency Strength on Pro, Auto TPSL and MTF Bias on Premium, the full MT5 set on
                Elite.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <a
                href="https://vigco.co/la-scom-inv/ms/oQQlQ8yM"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("indicators_vantage_open_account")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ShieldCheck className="h-4 w-4" /> Open Account
              </a>
              <a
                href={LINKS.bot}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("indicators_vantage_free_access")}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-accent/60 bg-accent/5 px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                Get Free Access <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">
          Prices are in USD and are confirmed inside the enrollment bot before payment. Trading carries risk of loss.
        </p>
      </main>

      <Footer />
    </div>
  );
}
