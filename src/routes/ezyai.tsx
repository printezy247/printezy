import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bell, Bot, Check, LayoutDashboard, Newspaper, Rocket, Search, Send } from "lucide-react";
import { Nav, Footer, LINKS, brandLogo } from "@/components/landing/Landing";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import { trackPageLoad, trackEngagement, goTrack } from "@/lib/analytics";
import { SITE_URL } from "@/lib/bot/tiers";

export const Route = createFileRoute("/ezyai")({
  head: () => ({
    meta: [
      { title: "EzyAI — AI Trading Signals on Telegram | EzyMap Algo" },
      {
        name: "description",
        content:
          "EzyAI turns free market data into trading confluence on Telegram — technical analysis, live watch alerts, fundamentals and autopilot signals, free to start.",
      },
      { property: "og:title", content: "EzyAI — AI Trading Signals on Telegram" },
      {
        property: "og:description",
        content: "On-demand analysis, live alerts, fundamentals and autopilot signals — free to start.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${SITE_URL}${brandLogo}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "EzyAI — AI Trading Signals on Telegram" },
      { name: "twitter:image", content: `${SITE_URL}${brandLogo}` },
    ],
  }),
  component: EzyAiPage,
});

const FEATURES: { icon: typeof Search; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Search, titleKey: "ezyai_feature_analyze_title", descKey: "ezyai_feature_analyze_desc" },
  { icon: Bell, titleKey: "ezyai_feature_watch_title", descKey: "ezyai_feature_watch_desc" },
  { icon: Newspaper, titleKey: "ezyai_feature_fundamentals_title", descKey: "ezyai_feature_fundamentals_desc" },
  { icon: Rocket, titleKey: "ezyai_feature_autopilot_title", descKey: "ezyai_feature_autopilot_desc" },
  { icon: LayoutDashboard, titleKey: "ezyai_feature_dashboard_title", descKey: "ezyai_feature_dashboard_desc" },
];

type PlanTier = {
  labelKey: TranslationKey;
  price: string;
  badgeKey?: TranslationKey;
  highlight?: boolean;
};

const PLANS: PlanTier[] = [
  { labelKey: "ezyai_tier_1m_label", price: "$14.99" },
  { labelKey: "ezyai_tier_6m_label", price: "$44.99", badgeKey: "ezyai_tier_6m_badge", highlight: true },
  { labelKey: "ezyai_tier_12m_label", price: "$99.99", badgeKey: "ezyai_tier_12m_badge" },
];

function EzyAiPage() {
  const { t } = useTranslation();

  useEffect(() => {
    trackPageLoad("ezyai");
    const stop = trackEngagement();
    return stop;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <Bot className="h-3.5 w-3.5 text-primary" /> {t("ezyai_desk_label")}
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl">{t("ezyai_page_title")}</h1>
            <p className="mt-3 text-sm text-body sm:text-base">{t("ezyai_page_desc")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a
                  href={LINKS.ezyai}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack("ezyai_hero_open_bot")}
                >
                  <Send className="h-4 w-4" /> {t("ezyai_cta_open_bot")}
                </a>
              </Button>
            </div>
          </div>
        </header>

        {/* Features */}
        <section className="mt-14">
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
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">{t("ezyai_pro_label")}</h3>
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
                {p.highlight ? <div className="bg-gold absolute inset-x-0 top-0 h-[3px]" aria-hidden="true" /> : null}
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t(p.labelKey)}
                </h3>
                <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-foreground">{p.price}</p>
                {p.badgeKey ? <p className="mt-1 text-[11px] font-medium text-accent">{t(p.badgeKey)}</p> : null}
                <div className="mt-6">
                  <Button asChild variant={p.highlight ? "primary" : "outline"} className="w-full">
                    <a
                      href={LINKS.ezyai}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => goTrack(`ezyai_pricing_${p.labelKey}`)}
                    >
                      {t("ezyai_upgrade_pro")}
                    </a>
                  </Button>
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

        <div className="mx-auto mt-6 flex max-w-4xl items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{t("ezyai_disclaimer")}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
