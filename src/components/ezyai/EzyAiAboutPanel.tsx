import { Bell, LayoutDashboard, Newspaper, Rocket, Search, Send } from "lucide-react";
import { BuyButton } from "@/components/BuyButton";
import { Button } from "@/components/ui/button";
import { LINKS } from "@/lib/links";
import { useTranslation } from "@/lib/i18n";
import { goTrack } from "@/lib/analytics";
import { formatUsd, getCatalogItem } from "@/lib/catalog";
import type { TranslationKey } from "@/lib/translations";

const FEATURES: { icon: typeof Search; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Search, titleKey: "ezyai_feature_analyze_title", descKey: "ezyai_feature_analyze_desc" },
  { icon: Bell, titleKey: "ezyai_feature_watch_title", descKey: "ezyai_feature_watch_desc" },
  {
    icon: Newspaper,
    titleKey: "ezyai_feature_fundamentals_title",
    descKey: "ezyai_feature_fundamentals_desc",
  },
  {
    icon: Rocket,
    titleKey: "ezyai_feature_autopilot_title",
    descKey: "ezyai_feature_autopilot_desc",
  },
  {
    icon: LayoutDashboard,
    titleKey: "ezyai_feature_dashboard_title",
    descKey: "ezyai_feature_dashboard_desc",
  },
];

type PlanTier = {
  sku: string;
  labelKey: TranslationKey;
  badgeKey?: TranslationKey;
  highlight?: boolean;
};

// Prices come from the catalog (which mirrors the bot's own PLANS table).
const PLANS: PlanTier[] = [
  { sku: "ezyai_pro_1m", labelKey: "ezyai_tier_1m_label" },
  {
    sku: "ezyai_pro_6m",
    labelKey: "ezyai_tier_6m_label",
    badgeKey: "ezyai_tier_6m_badge",
    highlight: true,
  },
  { sku: "ezyai_pro_1y", labelKey: "ezyai_tier_12m_label", badgeKey: "ezyai_tier_12m_badge" },
];

/** The static about tab: what the bot does, free vs PRO, and the PRO tiers. */
export function EzyAiAboutPanel() {
  const { t } = useTranslation();

  return (
    <div role="tabpanel" id="ezyai-panel-about" aria-labelledby="ezyai-tab-about">
      {/* Features */}
      <section className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.titleKey} className="glass-card flex h-full flex-col rounded-xl p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t(f.titleKey)}</h3>
              <p className="mt-2 text-sm text-body">{t(f.descKey)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Free vs PRO */}
      <section className="mt-14">
        <h2 className="text-2xl">{t("ezyai_free_pro_title")}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("ezyai_free_label")}
            </h3>
            <p className="mt-3 text-sm text-body">{t("ezyai_free_desc")}</p>
          </div>
          <div className="rounded-xl border border-accent/60 bg-surface-elevated p-6 shadow-elevated ring-1 ring-accent/15">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
              {t("ezyai_pro_label")}
            </h3>
            <p className="mt-3 text-sm text-body">{t("ezyai_pro_desc")}</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mt-14">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
          {t("ezyai_pricing_eyebrow")}
        </p>
        <h2 className="mt-2 text-2xl">{t("ezyai_pricing_title")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-body">{t("ezyai_pricing_subtitle")}</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {PLANS.map((p) => (
            <article
              key={p.labelKey}
              className={`relative flex h-full flex-col rounded-xl p-6 ${
                p.highlight
                  ? "border border-accent/60 bg-surface-elevated shadow-elevated ring-1 ring-accent/15 sm:-translate-y-1.5"
                  : "glass-card"
              }`}
            >
              {p.highlight ? (
                <div className="bg-gold absolute inset-x-0 top-0 h-[3px]" aria-hidden="true" />
              ) : null}
              <h3 className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t(p.labelKey)}
              </h3>
              <p className="mt-2 text-center font-mono text-2xl font-extrabold tabular-nums text-foreground">
                {formatUsd(getCatalogItem(p.sku)?.amountCents ?? 0)}
              </p>
              {p.badgeKey ? (
                <p className="mt-1 text-center text-[11px] font-medium text-accent">
                  {t(p.badgeKey)}
                </p>
              ) : null}
              <div className="mt-6">
                <BuyButton
                  sku={p.sku}
                  label={t("ezyai_buy_pro")}
                  variant={p.highlight ? "primary" : "gold"}
                />
                <a
                  href={LINKS.ezyai}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack(`ezyai_pricing_${p.labelKey}`)}
                  className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("ezyai_upgrade_pro")}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Markets */}
      <section className="mt-14 rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">{t("ezyai_markets_title")}</h3>
        <p className="mt-2 text-sm text-body">{t("ezyai_markets_desc")}</p>
      </section>

      {/* Final CTA */}
      <section className="glass-card mt-14 rounded-xl px-6 py-14 text-center sm:px-12">
        <h2 className="text-3xl sm:text-4xl">{t("ezyai_final_title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-body">{t("ezyai_final_body")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <a
              href={LINKS.ezyai}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => goTrack("ezyai_final_open_bot")}
            >
              <Send className="h-4 w-4" /> {t("ezyai_cta_open_bot")}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
