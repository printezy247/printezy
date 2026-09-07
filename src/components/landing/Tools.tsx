import { useState, type ReactNode } from "react";
import { Check, ArrowRight } from "lucide-react";
import mt5LogoAsset from "@/assets/mt5-logo.png";
import { BuyButton } from "@/components/BuyButton";
import { formatUsd, getCatalogItem } from "@/lib/catalog";
import { goTrack } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

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
        <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-primary">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base text-body">{subtitle}</p> : null}
    </div>
  );
}

type TvProduct = { id: string; name: string; taglineKey: TranslationKey; bulletKeys: TranslationKey[]; highlightKey?: TranslationKey };

const TV_PRODUCTS: TvProduct[] = [
  {
    id: "tv_lite",
    name: "TradingView — EzyMap Lite",
    taglineKey: "tv_lite_tagline",
    bulletKeys: ["tv_lite_b1", "tv_lite_b2", "tv_lite_b3"],
  },
  {
    id: "tv_pro",
    name: "TradingView — EzyMap Pro",
    taglineKey: "tv_pro_tagline",
    bulletKeys: ["tv_pro_b1", "tv_pro_b2", "tv_pro_b3"],
    highlightKey: "highlight_most_complete",
  },
];

const TV_PRICE: Record<string, number> = { tv_lite: 4900, tv_pro: 24900 };

type Term = "1m" | "6m" | "1y";
const TERM_LABEL_KEY: Record<Term, TranslationKey> = { "1m": "term_1m", "6m": "term_6m", "1y": "term_1y" };

type Mt5Product = { id: string; name: string; taglineKey: TranslationKey; bulletKeys: TranslationKey[]; highlightKey?: TranslationKey };

const MT5_PRODUCTS: Mt5Product[] = [
  {
    id: "mt5_bundle",
    name: "MT5 Indicator Bundle",
    taglineKey: "mt5_bundle_tagline",
    bulletKeys: ["mt5_bundle_b1", "mt5_bundle_b2", "mt5_bundle_b3"],
    highlightKey: "highlight_best_value",
  },
  {
    id: "mt5_bulk_close",
    name: "Bulk Close — BONUS Layer Close",
    taglineKey: "mt5_bulk_close_tagline",
    bulletKeys: ["mt5_bulk_close_b1", "mt5_bulk_close_b2", "mt5_bulk_close_b3"],
    highlightKey: "highlight_top_selling",
  },
  {
    id: "mt5_drawdown_guardian",
    name: "Drawdown Guardian",
    taglineKey: "mt5_drawdown_tagline",
    bulletKeys: ["mt5_drawdown_b1", "mt5_drawdown_b2", "mt5_drawdown_b3"],
    highlightKey: "highlight_prop_firm",
  },
  {
    id: "mt5_auto_tpsl",
    name: "Auto TPSL",
    taglineKey: "mt5_auto_tpsl_tagline",
    bulletKeys: ["mt5_auto_tpsl_b1", "mt5_auto_tpsl_b2", "mt5_auto_tpsl_b3"],
  },
  {
    id: "mt5_currency_strength",
    name: "Currency Strength Meter",
    taglineKey: "mt5_currency_strength_tagline",
    bulletKeys: ["mt5_currency_strength_b1", "mt5_currency_strength_b2", "mt5_currency_strength_b3"],
  },
  {
    id: "mt5_mtf_bias",
    name: "MTF Bias",
    taglineKey: "mt5_mtf_bias_tagline",
    bulletKeys: ["mt5_mtf_bias_b1", "mt5_mtf_bias_b2", "mt5_mtf_bias_b3"],
  },
];

function skuFor(productId: string, term: Term): string {
  return `${productId}_${term}`;
}

function TvCard({ product }: { product: TvProduct }) {
  const { t } = useTranslation();
  return (
    <article id={product.id} className="glass-card card-lift relative flex h-full scroll-mt-24 flex-col rounded-xl p-6">
      {product.highlightKey ? (
        <span className="absolute right-4 top-4 rounded-full border border-[rgba(201,161,58,0.45)] bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
          {t(product.highlightKey)}
        </span>
      ) : null}
      <h3 className="pr-24 text-lg font-semibold">{product.name}</h3>
      <p className="mt-2 text-sm text-body">{t(product.taglineKey)}</p>
      <ul className="mt-4 flex-1 space-y-2.5">
        {product.bulletKeys.map((bk) => (
          <li key={bk} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-body">{t(bk)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 font-mono text-2xl font-bold tabular-nums text-foreground">
        {formatUsd(TV_PRICE[product.id])}
      </p>
      <BuyButton sku={product.id} label={t("tools_buy")} align="left" inlineForm className="mt-3" />
    </article>
  );
}

function Mt5Card({ product }: { product: Mt5Product }) {
  const [term, setTerm] = useState<Term>("1m");
  const sku = skuFor(product.id, term);
  const item = getCatalogItem(sku);
  const { t } = useTranslation();

  return (
    <article id={product.id} className="glass-card card-lift relative flex h-full scroll-mt-24 flex-col rounded-xl p-6">
      {product.highlightKey ? (
        <span className="absolute right-4 top-4 rounded-full border border-[rgba(201,161,58,0.45)] bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
          {t(product.highlightKey)}
        </span>
      ) : null}
      <h3 className="pr-24 text-lg font-semibold">{product.name}</h3>
      <p className="mt-2 text-sm text-body">{t(product.taglineKey)}</p>
      <ul className="mt-4 space-y-2.5">
        {product.bulletKeys.map((bk) => (
          <li key={bk} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-body">{t(bk)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex rounded-lg border border-border bg-[#0a0c0b] p-1">
        {(Object.keys(TERM_LABEL_KEY) as Term[]).map((tm) => (
          <button
            key={tm}
            type="button"
            onClick={() => setTerm(tm)}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              term === tm ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(TERM_LABEL_KEY[tm])}
          </button>
        ))}
      </div>

      <p className="mt-4 flex-1 text-center font-mono text-2xl font-bold tabular-nums text-foreground">
        {item ? formatUsd(item.amountCents) : "—"}
      </p>
      <BuyButton sku={sku} label={t("tools_buy")} inlineForm className="mt-3" />
    </article>
  );
}

export function Tools() {
  const { t } = useTranslation();
  return (
    <Section id="tools">
      <SectionHeading
        eyebrow={t("tools_eyebrow")}
        title={t("tools_title")}
        subtitle={t("tools_subtitle")}
      />

      <div className="mt-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#0a0c0b] p-1.5">
            <img src={tradingViewLogo} alt="TradingView logo" loading="lazy" className="h-full w-full object-contain" />
          </span>
          <div>
            <h3 className="text-xl font-semibold">{t("tools_tv_section_title")}</h3>
            <p className="text-sm text-body">{t("tools_tv_section_sub")}</p>
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
          {t("tools_open_tv_account")} <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-14">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#f4f1ea] p-1.5">
            <img src={mt5Logo} alt="MetaTrader 5 logo" loading="lazy" className="h-full w-full object-contain" />
          </span>
          <div>
            <h3 className="text-xl font-semibold">{t("tools_mt5_section_title")}</h3>
            <p className="text-sm text-body">{t("tools_mt5_section_sub")}</p>
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
          {t("products_download_mt5")} <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </Section>
  );
}
