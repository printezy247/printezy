import { useState, type ReactNode } from "react";
import { Check, ArrowRight } from "lucide-react";
import mt5LogoAsset from "@/assets/mt5-logo.png";
import { BuyButton } from "@/components/BuyButton";
import { formatUsd, getCatalogItem } from "@/lib/catalog";
import { goTrack } from "@/lib/analytics";

// Not imported from Landing.tsx to avoid a circular module dependency
// (Landing.tsx mounts <Tools />) — kept in sync manually if it changes.
const TRADINGVIEW_LINK = "https://www.tradingview.com/pricing/?share_your_love=printezyusd";

const tradingViewLogo = "https://s3.tradingview.com/userpics/6171439-mFQX_big.png";
const mt5Logo = mt5LogoAsset;

function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

type TvProduct = { id: string; name: string; tagline: string; bullets: string[]; highlight?: string };

const TV_PRODUCTS: TvProduct[] = [
  {
    id: "tv_lite",
    name: "TradingView — EzyMap Lite",
    tagline: "Entry-level mapping overlay for TradingView charts.",
    bullets: ["Auto support & resistance mapping", "Clean buy/sell bias arrows", "Works on any TradingView plan"],
  },
  {
    id: "tv_pro",
    name: "TradingView — EzyMap Pro",
    tagline: "Full M1–H4 signal engine used in the Premium package.",
    bullets: ["M1–H4 entry, SL and TP signals", "Multi-timeframe confluence filter", "Lifetime updates included"],
    highlight: "Most complete",
  },
];

const TV_PRICE: Record<string, number> = { tv_lite: 4900, tv_pro: 24900 };

type Term = "1m" | "6m" | "1y";
const TERM_LABEL: Record<Term, string> = { "1m": "1 Month", "6m": "6 Months", "1y": "1 Year" };

type Mt5Product = { id: string; name: string; tagline: string; bullets: string[]; highlight?: string };

const MT5_PRODUCTS: Mt5Product[] = [
  {
    id: "mt5_bundle",
    name: "MT5 Indicator Bundle",
    tagline: "Every MT5 tool below in one licence — worth $999.",
    bullets: ["All MT5 indicators included", "Priority setup help", "Prop-firm friendly settings"],
    highlight: "Best value",
  },
  {
    id: "mt5_bulk_close",
    name: "Bulk Close — BONUS Layer Close",
    tagline: "Close baskets or single layers of positions in one click.",
    bullets: ["One-click basket close", "Layer-by-layer partial close", "Hotkey panel on chart"],
    highlight: "Top selling",
  },
  {
    id: "mt5_drawdown_guardian",
    name: "Drawdown Guardian",
    tagline: "Hard-stop protection that keeps prop-firm rules intact.",
    bullets: ["Daily & total drawdown limits", "Auto flatten on breach", "Live risk readout on chart"],
    highlight: "Prop firm favorite",
  },
  {
    id: "mt5_auto_tpsl",
    name: "Auto TPSL",
    tagline: "Automatic take profit and stop loss on every fill.",
    bullets: ["Rule-based TP/SL placement", "Break-even & trailing modes", "Works with manual or EA trades"],
  },
  {
    id: "mt5_currency_strength",
    name: "Currency Strength Meter",
    tagline: "See which currency is leading before you enter.",
    bullets: ["Real-time strength ranking", "Pair-by-pair comparison", "Included in the Pro package"],
  },
  {
    id: "mt5_mtf_bias",
    name: "MTF Bias",
    tagline: "Multi-timeframe direction bias in a single dashboard.",
    bullets: ["M1 to D1 bias grid", "Confluence scoring", "Alerts on bias flip"],
  },
];

function skuFor(productId: string, term: Term): string {
  return `${productId}_${term}`;
}

function TvCard({ product }: { product: TvProduct }) {
  return (
    <article id={product.id} className="glass-card relative flex h-full scroll-mt-24 flex-col rounded-xl p-6">
      {product.highlight ? (
        <span className="absolute right-4 top-4 rounded-full border border-[rgba(201,161,58,0.45)] bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
          {product.highlight}
        </span>
      ) : null}
      <h3 className="pr-24 text-lg font-semibold">{product.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{product.tagline}</p>
      <ul className="mt-4 flex-1 space-y-2.5">
        {product.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">{b}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-2xl font-bold text-foreground">{formatUsd(TV_PRICE[product.id])}</p>
      <BuyButton sku={product.id} label="Buy" className="mt-3" />
    </article>
  );
}

function Mt5Card({ product }: { product: Mt5Product }) {
  const [term, setTerm] = useState<Term>("1m");
  const sku = skuFor(product.id, term);
  const item = getCatalogItem(sku);

  return (
    <article id={product.id} className="glass-card relative flex h-full scroll-mt-24 flex-col rounded-xl p-6">
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

      <div className="mt-5 flex rounded-lg border border-border bg-[#0a0c0b] p-1">
        {(Object.keys(TERM_LABEL) as Term[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTerm(t)}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              term === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {TERM_LABEL[t]}
          </button>
        ))}
      </div>

      <p className="mt-4 flex-1 text-2xl font-bold text-foreground">
        {item ? formatUsd(item.amountCents) : "—"}
      </p>
      <BuyButton sku={sku} label="Buy" className="mt-3" />
    </article>
  );
}

export function Tools() {
  return (
    <Section id="tools">
      <SectionHeading
        eyebrow="Tools"
        title="TradingView and MT5 indicators"
        subtitle="The same tools our members trade with — live prices, no separate page."
      />

      <div className="mt-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#0a0c0b] p-1.5">
            <img src={tradingViewLogo} alt="TradingView logo" loading="lazy" className="h-full w-full object-contain" />
          </span>
          <div>
            <h3 className="text-xl font-semibold">TradingView Indicators</h3>
            <p className="text-sm text-muted-foreground">One-time licence, lifetime updates.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {TV_PRODUCTS.map((p) => (
            <TvCard key={p.id} product={p} />
          ))}
        </div>
        <a
          href={TRADINGVIEW_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => goTrack("tools_tv_open_account")}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Open a free TradingView account <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-14">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#f4f1ea] p-1.5">
            <img src={mt5Logo} alt="MetaTrader 5 logo" loading="lazy" className="h-full w-full object-contain" />
          </span>
          <div>
            <h3 className="text-xl font-semibold">MT5 Indicators</h3>
            <p className="text-sm text-muted-foreground">Pick a term — monthly, 6-month or yearly.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MT5_PRODUCTS.map((p) => (
            <Mt5Card key={p.id} product={p} />
          ))}
        </div>
        <a
          href="https://www.metatrader5.com/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => goTrack("tools_mt5_download")}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          Download MT5 Now <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </Section>
  );
}
