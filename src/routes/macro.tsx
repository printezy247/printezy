import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import { BuyButton } from "@/components/BuyButton";
import { trackPageLoad, trackEngagement, track } from "@/lib/analytics";
import { useLocalClock } from "@/lib/local-time";
import { useTranslation } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import { localizedHead } from "@/lib/seo";
import type { TranslationKey } from "@/lib/translations";
import {
  MACRO_FILTERS,
  MACRO_PRICES,
  fetchFearGreed,
  fetchMacroDesk,
  GAUGE_TRACK,
  IMPACT_COLOR,
  recessionColor,
  stanceColor,
  type FearGreed,
  type MacroDesk,
  type MacroFilter,
  type Stance,
  type TrendCard,
} from "@/lib/macro-desk";
import { useServerFn } from "@tanstack/react-start";
import { getEconomicCalendar, type EconomicCalendar } from "@/lib/macro-calendar.functions";
import { getMacroLive, type MacroLive } from "@/lib/macro-live.functions";
import { formatLocalTime } from "@/lib/local-time";

const macroLogo = "/__l5e/assets-v1/398fbb63-d47e-4553-8892-9dfb7bda17d4/macro-logo.png";
const FOREXFACTORY = "https://www.forexfactory.com/calendar";

export function macroHead(locale: "en" | "ms") {
  const t = translations[locale];
  return localizedHead({
    path: "/macro",
    locale,
    title: t.macro_meta_title,
    description: t.macro_meta_desc,
    ogDescription: t.macro_og_desc,
    image: macroLogo,
    imageAlt: "MacroTrader desk logo",
    twitterDescription: t.macro_twitter_desc,
  });
}

export const Route = createFileRoute("/macro")({
  head: () => macroHead("en"),
  component: MacroPage,
});

/* ------------------------------------------------------------------ */
/* Small primitives                                                    */
/* ------------------------------------------------------------------ */

function Badge({ tone, children }: { tone: "free" | "paid"; children: React.ReactNode }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] ${
        tone === "free"
          ? "bg-primary/15 text-primary"
          : "border border-accent/40 text-accent"
      }`}
    >
      {children}
    </span>
  );
}

function Card({
  title,
  subtitle,
  badge,
  note,
  children,
  footer,
  className = "",
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  note?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base ">{title}</h2>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {badge}
      </div>
      {note ? <p className="mt-1 text-[11.5px] text-muted-foreground">{note}</p> : null}
      <div className="mt-4">{children}</div>
      {footer ? <div className="mt-4 border-t border-border pt-3">{footer}</div> : null}
    </section>
  );
}

const mono = "font-mono text-[13px] tracking-tight tabular-nums";

/**
 * Rendered bars replace the monospace gauges: only the fill / marker carries
 * colour, the empty track stays muted.
 */
function FillBar({
  percent,
  color,
  height = 6,
}: {
  percent: number;
  color: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full min-w-[80px] overflow-hidden rounded-full"
      style={{ height, backgroundColor: GAUGE_TRACK }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          boxShadow: `0 0 0 1px ${color}33`,
        }}
      />
    </div>
  );
}

/** Dovish (left) → hawkish (right) track with a dot marker and centre tick. */
function StanceBar({ stance, color }: { stance: Stance; color: string }) {
  const pct = stance === "hawkish" ? 100 : stance === "neutral" ? 50 : 0;
  return (
    <div className="relative w-full min-w-[80px]" style={{ height: 10 }}>
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full"
        style={{ height: 4, backgroundColor: GAUGE_TRACK }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 rounded-full"
        style={{
          height: 8,
          width: 2,
          left: "50%",
          marginLeft: -1,
          backgroundColor: "rgba(255,255,255,0.16)",
        }}
      />
      <div
        className="absolute top-1/2 rounded-full transition-[left] duration-500 ease-out"
        style={{
          height: 10,
          width: 10,
          left: `calc(${pct}% - 5px)`,
          marginTop: -5,
          backgroundColor: color,
          boxShadow: `0 0 0 3px ${color}22`,
        }}
      />
    </div>
  );
}

/** Smooth SVG sparkline with a gradient area under the line. */
function SparklineChart({
  points,
  color,
  height = 48,
}: {
  points: number[];
  color: string;
  height?: number;
}) {
  const width = 100;
  const max = Math.max(...points, 7);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((p - min) / range) * (height - 8) - 4,
  }));
  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`area-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#area-${color.replace("#", "")})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3" fill={color} />
    </svg>
  );
}

/** A labelled spectrum bar from negative/bearish (left) to positive/bullish (right). */
function SpectrumBar({
  percent,
  color,
  leftLabel,
  rightLabel,
}: {
  percent: number;
  color: string;
  leftLabel: string;
  rightLabel: string;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded-full"
        style={{ height: 6, backgroundColor: GAUGE_TRACK }}
      >
        <div
          className="absolute top-0 h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function TrendCard({ trend }: { trend: TrendCard }) {
  const { t } = useTranslation();
  const isFed = trend.key === "fed-tone";
  const current = trend.trend[trend.trend.length - 1] ?? 4;
  const prev = trend.trend[trend.trend.length - 2] ?? current;
  const delta = current - prev;
  const pct = (current / 7) * 100;
  const color = isFed
    ? stanceColor(current >= 5 ? "hawkish" : current <= 2 ? "dovish" : "neutral")
    : current >= 5
      ? "#2fbf71"
      : current <= 2
        ? "#d9534f"
        : "#c9a13a";

  return (
    <Card
      title={trend.title}
      badge={<Badge tone="paid">{trend.price}</Badge>}
      className="flex flex-col"
      footer={
        <div className="space-y-2">
          <BuyButton sku={trend.sku} label={t("macro_pay_with_card_price").replace("{price}", trend.price)} />
          <a
            href={LINKS.macro}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("click", `macro_telegram_${trend.key}`)}
            className="block text-center text-xs font-semibold text-muted-foreground hover:text-primary hover:underline"
          >
            {t("macro_subscribe_telegram")}
          </a>
        </div>
      }
    >
      <p className="text-sm text-body">{trend.description}</p>

      <div className="mt-4 rounded-lg border border-border bg-surface/50 p-3">
        <SparklineChart points={trend.trend} color={color} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className={`text-2xl font-black ${mono}`} style={{ color }}>
            {current}/7
          </p>
          <p className="text-xs text-muted-foreground">{trend.readout}</p>
        </div>
        <span
          className={`rounded px-2 py-1 text-[11px] font-bold ${mono} ${
            delta > 0 ? "bg-primary/15 text-primary" : delta < 0 ? "bg-red-500/15 text-red-400" : "bg-accent/15 text-accent"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {delta} {t("macro_today")}
        </span>
      </div>

      <div className="mt-4">
        {isFed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("macro_dovish")}</span>
              <span>{t("macro_hawkish")}</span>
            </div>
            <StanceBar
              stance={current >= 5 ? "hawkish" : current <= 2 ? "dovish" : "neutral"}
              color={color}
            />
          </div>
        ) : (
          <SpectrumBar
            percent={pct}
            color={color}
            leftLabel={t("macro_bearish")}
            rightLabel={t("macro_bullish")}
          />
        )}
      </div>
    </Card>
  );
}


/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const FILTER_LABEL_KEY: Record<MacroFilter, TranslationKey> = {
  All: "macro_filter_all",
  Calendar: "macro_filter_calendar",
  "Central Banks": "macro_filter_central_banks",
  Recession: "macro_filter_recession",
  Crypto: "macro_filter_crypto",
  Sentiment: "macro_filter_sentiment",
};

export function MacroPage() {
  const [filter, setFilter] = useState<MacroFilter>("All");
  const [desk, setDesk] = useState<MacroDesk | null>(null);
  const [fng, setFng] = useState<FearGreed | null>(null);
  const [cal, setCal] = useState<EconomicCalendar | null>(null);
  const [live, setLive] = useState<MacroLive>(null);
  const clock = useLocalClock();
  const { t } = useTranslation();
  const fetchCalendar = useServerFn(getEconomicCalendar);
  const fetchLive = useServerFn(getMacroLive);

  useEffect(() => {
    trackPageLoad("macro");
    const stop = trackEngagement();
    let alive = true;
    fetchMacroDesk().then((d) => alive && setDesk(d));
    fetchFearGreed().then((f) => alive && setFng(f));
    fetchCalendar()
      .then((c) => alive && setCal(c))
      .catch(() => alive && setCal({ day: null, isToday: false, rows: [], updatedAt: null }));
    fetchLive()
      .then((l) => alive && setLive(l))
      .catch(() => {});
    return () => {
      alive = false;
      stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Central banks, recession odds, decision dates and the two trend cards
  // come from the bot when it is connected, else the seeded sample copy.
  const view = useMemo(() => {
    const d = live?.desk;
    const today = new Date().toISOString().slice(0, 10);
    const toIdx = (s: number) =>
      Math.max(0, Math.min(7, Math.round(((Math.max(-1, Math.min(1, s)) + 1) / 2) * 7)));
    const trends = (desk?.trends ?? []).map((seed) => {
      const src = seed.key === "fed-tone" ? d?.fed_tone : d?.news_sentiment?.aggregate;
      if (!src) return { ...seed, readout: `${seed.readout} · ${t("macro_sample_short")}` };
      const scores = src.history.map((h) => h.score);
      if (scores.length === 0 || src.history[src.history.length - 1]?.date !== today) {
        scores.push(src.score);
      }
      const readout = (
        seed.key === "fed-tone" ? t("macro_tone_readout") : t("macro_sentiment_readout")
      ).replace("{label}", t(`macro_label_${src.label}` as TranslationKey));
      return { ...seed, trend: scores.slice(-7).map(toIdx), readout };
    });
    return {
      centralBanks: d
        ? d.central_banks.map((b) => ({
            bank: b.name,
            rate: b.rate,
            stance: b.stance,
            nextMeeting: b.next_meeting,
          }))
        : (desk?.centralBanks ?? []),
      recession: d
        ? d.recession.map((r) => ({
            country: r.name,
            probability: r.probability,
            driver: r.indicator,
          }))
        : (desk?.recession ?? []),
      rateDecisions: d
        ? d.rate_decisions.map((r) => ({ bank: r.bank, date: r.date }))
        : (desk?.rateDecisions ?? []),
      trends,
      note: live
        ? t("macro_live_note").replace("{time}", formatLocalTime(new Date(live.updatedAt)))
        : t("macro_sample_note"),
    };
  }, [live, desk, t]);

  const gold = live?.desk.gold_fear_greed ?? null;

  const calDayLabel = useMemo(() => {
    if (!cal?.day) return "";
    return new Date(`${cal.day}T12:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }, [cal?.day]);

  const digest = useMemo(() => clock.toLocal("08:00"), [clock]);
  const shows = (f: MacroFilter) => filter === "All" || filter === f;

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-6 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={macroLogo}
              alt="MacroTrader desk"
              className="h-14 w-14 rounded-xl border border-border bg-[#0a0c0b] object-contain p-1.5"
              loading="lazy"
            />
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
                {t("macro_desk_label")}
              </p>
              <h1 className="mt-1 text-3xl sm:text-4xl">{t("macro_page_title")}</h1>
              <p className="mt-2 max-w-xl text-sm text-body">
                {t("macro_page_desc")}
              </p>
            </div>
          </div>

          <dl className="shrink-0 space-y-1.5 text-sm md:text-right">
            <div>
              <dt className="inline text-muted-foreground">{t("macro_digest_label")} · </dt>
              <dd className="inline font-semibold">
                {digest} {clock.ready ? clock.tzLabel : "EST"}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">{t("macro_whale_polling_label")} · </dt>
              <dd className="inline font-semibold">{t("macro_whale_polling_value")}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">{t("macro_timezone_label")} · </dt>
              <dd className="inline font-semibold">{clock.ready ? clock.tzLabel : "EST"}</dd>
            </div>
          </dl>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 py-6">
          {MACRO_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-body hover:border-accent/50 hover:text-foreground"
              }`}
            >
              {t(FILTER_LABEL_KEY[f])}
            </button>
          ))}
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main column */}
          <div className="min-w-0 space-y-7">
            {shows("Calendar") ? (
              <Card
                title={t("macro_calendar_title")}
                subtitle={
                  cal && cal.day && !cal.isToday
                    ? t("macro_calendar_next_day").replace("{day}", calDayLabel)
                    : undefined
                }
                badge={<Badge tone="free">{MACRO_PRICES.calendar}</Badge>}
                note={t("macro_calendar_note").replace("{tz}", clock.ready ? clock.tzLabel : "EST")}
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11.5px]">
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                      {(["high", "medium", "low"] as const).map((i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 capitalize">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: IMPACT_COLOR[i] }}
                          />
                          {t(`macro_impact_${i}` as TranslationKey)} {t("macro_impact_suffix")}
                        </span>
                      ))}
                      {cal?.updatedAt ? (
                        <span>
                          {t("macro_calendar_updated").replace(
                            "{time}",
                            formatLocalTime(new Date(cal.updatedAt)),
                          )}
                        </span>
                      ) : null}
                    </div>
                    <a
                      href={FOREXFACTORY}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("click", "macro_forexfactory")}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      {t("macro_crosscheck_ff")} <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <div
                    className="grid gap-x-3 text-left text-sm"
                    style={{ gridTemplateColumns: "56px 52px minmax(0, 1fr) 78px 78px" }}
                  >
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">{t("macro_col_time")}</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">{t("macro_col_ccy")}</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">{t("macro_col_event")}</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 text-right font-bold">{t("macro_col_forecast")}</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 text-right font-bold">{t("macro_col_previous")}</div>
                    {cal?.rows.map((r) => (
                      <Fragment key={`${r.nyTime}-${r.currency}-${r.event}`}>
                        <div className={`border-t border-border py-2.5 ${mono}`}>{clock.toLocal(r.nyTime)}</div>
                        <div className="border-t border-border py-2.5 font-semibold">{r.currency}</div>
                        <div className="border-t border-border py-2.5 pr-3">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: IMPACT_COLOR[r.impact] }}
                              title={`${r.impact} impact`}
                            />
                            {r.event}
                          </span>
                        </div>
                        <div className={`border-t border-border py-2.5 text-right ${mono}`}>{r.forecast}</div>
                        <div className={`border-t border-border py-2.5 text-right text-muted-foreground ${mono}`}>{r.previous}</div>
                      </Fragment>
                    ))}
                  </div>
                  {cal === null ? (
                    <p className="border-t border-border py-3 text-sm text-muted-foreground">…</p>
                  ) : cal.rows.length === 0 ? (
                    <p className="border-t border-border py-3 text-sm text-muted-foreground">
                      {t(cal.updatedAt ? "macro_calendar_empty" : "macro_calendar_unavailable")}
                    </p>
                  ) : null}
                </div>
              </Card>
            ) : null}

            {shows("Central Banks") ? (
              <Card
                title={t("macro_central_banks_title")}
                note={view.note}
                badge={<Badge tone="paid">{t("macro_heatmaps_label")} · {MACRO_PRICES.heatmaps}</Badge>}
                footer={
                  <p className="text-[11.5px] text-muted-foreground">
                    {t("macro_central_banks_footer")}
                  </p>
                }
              >
                <div className="overflow-x-auto">
                  <div
                    className="grid gap-x-3 text-left text-sm"
                    style={{ gridTemplateColumns: "minmax(0, 1fr) 96px minmax(90px, 150px) 86px" }}
                  >
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">{t("macro_col_bank")}</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">{t("macro_col_rate")}</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">{t("macro_col_stance")}</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 text-right font-bold">{t("macro_col_next_meeting")}</div>
                    {view.centralBanks.map((b) => (
                      <Fragment key={b.bank}>
                        <div className="border-t border-border py-2.5 pr-3 font-semibold">{b.bank}</div>
                        <div className={`border-t border-border py-2.5 ${mono}`}>{b.rate}</div>
                        <div className="border-t border-border py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <StanceBar stance={b.stance} color={stanceColor(b.stance)} />
                            <span
                              className="shrink-0 text-[11px] font-semibold capitalize"
                              style={{ color: stanceColor(b.stance) }}
                            >
                              {b.stance}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-border py-2.5 text-right text-muted-foreground">
                          {b.nextMeeting}
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t("macro_stance_reads_note")}
                  </p>
                </div>
              </Card>
            ) : null}

            {shows("Recession") ? (
              <Card
                title={t("macro_recession_title")}
                subtitle={t("macro_recession_subtitle")}
                note={view.note}
                badge={<Badge tone="paid">{t("macro_heatmaps_label")} · {MACRO_PRICES.heatmaps}</Badge>}
                footer={
                  <p className="text-[11.5px] text-muted-foreground">
                    {t("macro_recession_footer")}
                  </p>
                }
              >
                <div
                  className="grid gap-x-3 text-left text-sm"
                  style={{ gridTemplateColumns: "minmax(0, 150px) 52px minmax(80px, 140px) minmax(0, 1fr)" }}
                >
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">{t("macro_col_country")}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 text-right font-bold">{t("macro_col_prob")}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">{t("macro_col_gauge")}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">{t("macro_col_driver")}</div>
                  {view.recession.map((r) => (
                    <Fragment key={r.country}>
                      <div className="border-t border-border py-2.5 text-sm font-semibold">{r.country}</div>
                      <div
                        className="border-t border-border py-2.5 text-right font-mono text-sm font-bold tabular-nums"
                        style={{ color: recessionColor(r.probability) }}
                      >
                        {r.probability}%
                      </div>
                      <div className="flex items-center border-t border-border py-2.5 pr-3">
                        <FillBar percent={r.probability} color={recessionColor(r.probability)} />
                      </div>

                      <div className="border-t border-border py-2.5 text-xs text-muted-foreground">{r.driver}</div>
                    </Fragment>
                  ))}
                </div>
              </Card>
            ) : null}

            {shows("Sentiment") ? (
              <div className="grid gap-7 sm:grid-cols-2">
                {view.trends.map((trend) => (
                  <TrendCard key={trend.key} trend={trend} />
                ))}
              </div>
            ) : null}

            {shows("Crypto") ? (
              <Card title={t("macro_crypto_desk_title")} note={t("macro_crypto_desk_note")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {desk?.cryptoAddons.map((a) => (
                    <div
                      key={a.name}
                      className="flex flex-col rounded-lg border border-border bg-surface/50 p-4"
                    >
                      <p className="text-sm font-semibold">{a.name}</p>
                      <p className="mt-1 flex-1 text-xs text-muted-foreground">{a.description}</p>
                      <p className="mt-3 text-center font-mono text-lg font-bold tabular-nums text-accent">
                        {a.price}
                      </p>
                      <BuyButton sku={a.sku} label={t("macro_pay_with_card")} className="mt-2" />
                      <a
                        href={LINKS.macro}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          track("click", `macro_crypto_telegram_${a.name.toLowerCase().replace(/\s+/g, "_")}`)
                        }
                        className="mt-2 text-center text-xs font-semibold text-muted-foreground hover:text-primary hover:underline"
                      >
                        {t("macro_subscribe_telegram")}
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="space-y-7">
            {gold ? (
              <Card
                title={t("macro_gold_fg_title")}
                badge={<Badge tone="free">{MACRO_PRICES.calendar}</Badge>}
                footer={
                  <p className="text-[11.5px] text-muted-foreground">
                    {t("macro_updated_daily").replace("{source}", gold.source)}
                  </p>
                }
              >
                <p className="text-4xl font-black">
                  {gold.score}
                  <span className="text-base font-semibold text-muted-foreground">/100</span>
                </p>
                <p className="mt-1 text-sm font-bold text-accent">
                  {t(`macro_fg_${gold.label}` as TranslationKey)}
                  {typeof gold.previous === "number" ? (
                    <span className="ml-2 font-medium text-muted-foreground">
                      {t("macro_gold_fg_delta").replace(
                        "{delta}",
                        `${gold.score - gold.previous >= 0 ? "+" : ""}${gold.score - gold.previous}`,
                      )}
                    </span>
                  ) : null}
                </p>
                <div className="mt-3">
                  <FillBar percent={gold.score} color="#c9a13a" height={8} />
                  <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <span>{t("macro_fear_label")}</span>
                    <span>{t("macro_greed_label")}</span>
                  </div>
                </div>
              </Card>
            ) : null}

            <Card
              title={t("macro_fear_greed_title")}
              badge={<Badge tone="free">{MACRO_PRICES.calendar}</Badge>}
              footer={
                <p className="text-[11.5px] text-muted-foreground">
                  {t("macro_updated_daily").replace("{source}", fng?.source ?? "alternative.me")}
                </p>
              }
            >
              <p className="text-4xl font-black">
                {fng?.value ?? "—"}
                <span className="text-base font-semibold text-muted-foreground">/100</span>
              </p>
              <p className="mt-1 text-sm font-bold text-accent">{fng?.label ?? t("macro_loading")}</p>
              <div className="mt-3">
                <FillBar percent={fng?.value ?? 0} color="#c9a13a" height={8} />
                <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <span>{t("macro_fear_label")}</span>
                  <span>{t("macro_greed_label")}</span>
                </div>
              </div>

            </Card>

            <Card title={t("macro_next_rate_decisions_title")}>
              <ul className="space-y-2.5 text-sm">
                {view.rateDecisions.map((d) => (
                  <li key={d.bank} className="flex items-center justify-between gap-3">
                    <span className="text-body">{d.bank}</span>
                    <span className="font-semibold">{d.date}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <section className="rounded-xl border border-accent/45 bg-card p-5 text-center">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent">
                {t("macro_full_desk_label")}
              </p>
              <p className="mt-2 text-2xl font-black">
                $19<span className="text-sm font-semibold text-muted-foreground">{t("macro_per_month")}</span>
              </p>
              <p className="mt-2 text-sm text-body">
                {t("macro_full_desk_desc").replace(
                  "{time}",
                  clock.ready ? `${digest} ${clock.tzLabel}` : "08:00 EST",
                )}
              </p>
              <BuyButton sku="macro_full_desk" label={t("macro_pay_with_card_price").replace("{price}", "$19/mo")} variant="gold" className="mt-4" />
              <a
                href={LINKS.macro}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("click", "macro_subscribe")}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-body transition-colors hover:border-accent/50 hover:text-foreground"
              >
                <Send className="h-4 w-4" /> {t("macro_subscribe_via_telegram_full")}
              </a>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t("macro_payment_methods_note")}
              </p>
            </section>

            <div className="rounded-xl border border-border bg-surface p-5 text-[11.5px] leading-relaxed text-muted-foreground">
              {t("macro_disclaimer_before")}{" "}
              <a
                href={FOREXFACTORY}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ForexFactory
              </a>{" "}
              {t("macro_disclaimer_after")}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
