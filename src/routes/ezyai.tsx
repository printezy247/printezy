import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Check, LayoutDashboard, Newspaper, Rocket, Search, Send } from "lucide-react";
import { EzyAiLogo } from "@/components/brand/EzyAiLogo";
import { Nav, Footer, LINKS, brandLogo } from "@/components/landing/Landing";
import { Button } from "@/components/ui/button";
import { BuyButton } from "@/components/BuyButton";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import { trackPageLoad, trackEngagement, goTrack } from "@/lib/analytics";
import { SITE_URL } from "@/lib/bot/tiers";
import { formatUsd, getCatalogItem } from "@/lib/catalog";
import { formatLocalTime } from "@/lib/local-time";
import { getEzyAiBoard, getEzyAiHistory } from "@/lib/ezyai/signals.functions";
import { SignalCard } from "@/components/ezyai/SignalCard";
import { PerformancePanel } from "@/components/ezyai/PerformancePanel";

export const Route = createFileRoute("/ezyai")({
  // Deep-linkable tabs, so the hero card (and anything else) can point
  // straight at the live board rather than at the page and a hope.
  validateSearch: (search: Record<string, unknown>): { tab?: EzyAiTab } => ({
    tab:
      search.tab === "live" || search.tab === "history" || search.tab === "about"
        ? search.tab
        : undefined,
  }),
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
        content:
          "On-demand analysis, live alerts, fundamentals and autopilot signals — free to start.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/ezyai` },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ms_MY" },
      { property: "og:image", content: `${SITE_URL}${brandLogo}` },
      { property: "og:image:alt", content: "EzyMap ALGO logo" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "EzyAI — AI Trading Signals on Telegram" },
      { name: "twitter:image", content: `${SITE_URL}${brandLogo}` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/ezyai` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/ezyai` },
      { rel: "alternate", hrefLang: "ms", href: `${SITE_URL}/ms/ezyai` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/ezyai` },
    ],
  }),
  component: EzyAiPage,
});

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

type EzyAiTab = "live" | "history" | "about";

const TAB_LABEL: Record<EzyAiTab, TranslationKey> = {
  live: "ezyai_tab_live",
  history: "ezyai_tab_history",
  about: "ezyai_tab_about",
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`-mb-px border-b-2 px-1 pb-2 text-sm font-semibold transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function EzyAiPage() {
  const { t } = useTranslation();
  const search = useSearch({ from: "/ezyai", shouldThrow: false });
  const [tab, setTab] = useState<EzyAiTab>(search?.tab ?? "live");

  const loadBoard = useServerFn(getEzyAiBoard);
  const loadHistory = useServerFn(getEzyAiHistory);

  // The board refreshes on its own while it is on screen: the bot ticks
  // prices as trades run, and a stale rail is worse than no rail.
  const board = useQuery({
    queryKey: ["ezyai-board"],
    queryFn: () => loadBoard(),
    refetchInterval: 60_000,
  });
  const history = useQuery({
    queryKey: ["ezyai-history"],
    queryFn: () => loadHistory(),
    enabled: tab === "history",
  });

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
          <div className="flex max-w-2xl gap-5">
            <EzyAiLogo
              className="hidden h-20 w-20 shrink-0 rounded-full ring-1 ring-primary/25 sm:block"
              withWordmark
              title="EzyAI"
            />
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                <EzyAiLogo className="h-4 w-4" /> {t("ezyai_desk_label")}
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
          </div>
        </header>

        {/* Tabs */}
        <div className="mt-10 flex gap-6 border-b border-border">
          {(["live", "history", "about"] as EzyAiTab[]).map((id) => (
            <TabButton
              key={id}
              active={tab === id}
              onClick={() => {
                setTab(id);
                goTrack(`ezyai_tab_${id}`);
              }}
            >
              {t(TAB_LABEL[id])}
            </TabButton>
          ))}
        </div>

        {tab === "live" ? (
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl">{t("ezyai_sig_title")}</h2>
                <p className="mt-1 max-w-2xl text-sm text-body">{t("ezyai_sig_desc")}</p>
              </div>
              {board.data?.updatedAt ? (
                <p className="text-xs text-muted-foreground">
                  {t("ezyai_sig_updated").replace(
                    "{time}",
                    formatLocalTime(new Date(board.data.updatedAt)),
                  )}
                </p>
              ) : null}
            </div>

            <p className="mt-3 inline-flex rounded-md border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs text-body">
              {t("ezyai_sig_exclusive")}
            </p>

            {board.data && board.data.signals.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {board.data.signals.map((signal, i) => (
                  <SignalCard key={signal.id} signal={signal} index={i} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                {board.isLoading ? "…" : t("ezyai_sig_empty")}
              </p>
            )}
          </section>
        ) : null}

        {tab === "history" ? (
          <section className="mt-8">
            <h2 className="text-2xl">{t("ezyai_sig_history_title")}</h2>
            <div className="mt-6">
              {history.data ? (
                <PerformancePanel
                  performance={history.data.performance}
                  signals={history.data.signals}
                />
              ) : (
                <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  …
                </p>
              )}
            </div>
          </section>
        ) : null}

        {tab !== "about" ? null : (
          <>
            {/* Features */}
            <section className="mt-8">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((f) => (
                  <article
                    key={f.titleKey}
                    className="glass-card flex h-full flex-col rounded-xl p-6"
                  >
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
                      <div
                        className="bg-gold absolute inset-x-0 top-0 h-[3px]"
                        aria-hidden="true"
                      />
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
          </>
        )}

        <div className="mx-auto mt-10 flex max-w-4xl items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{t("ezyai_disclaimer")}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
