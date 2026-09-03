import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import { BuyButton } from "@/components/BuyButton";
import { trackPageLoad, trackEngagement, track } from "@/lib/analytics";
import { useLocalClock } from "@/lib/local-time";
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


const macroLogo = "/__l5e/assets-v1/398fbb63-d47e-4553-8892-9dfb7bda17d4/macro-logo.png";
const FOREXFACTORY = "https://www.forexfactory.com/calendar";

export const Route = createFileRoute("/macro")({
  head: () => ({
    meta: [
      { title: "Macro & Crypto Desk — EzyMap Algo" },
      {
        name: "description",
        content:
          "MacroTrader desk: economic calendar, central bank policy divergence, recession odds, Fed tone, news sentiment and crypto add-ons — times in your own timezone.",
      },
      { property: "og:title", content: "Macro & Crypto Desk — EzyMap Algo" },
      {
        property: "og:description",
        content:
          "Economic calendar, central bank divergence, recession odds and crypto desk add-ons from the MacroTrader Telegram desk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Macro & Crypto Desk — EzyMap Algo" },
      {
        name: "twitter:description",
        content: "Macro heatmaps, economic calendar and crypto add-ons, in your own timezone.",
      },
    ],
  }),
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
          <h2 className="text-base font-bold">{title}</h2>
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

const mono = "font-mono text-[13px] tracking-tight";

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
          <BuyButton sku={trend.sku} label={`Pay with card — ${trend.price}`} />
          <a
            href={LINKS.macro}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("click", `macro_telegram_${trend.key}`)}
            className="block text-center text-xs font-semibold text-muted-foreground hover:text-primary hover:underline"
          >
            or subscribe via Telegram
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
          {delta} today
        </span>
      </div>

      <div className="mt-4">
        {isFed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Dovish</span>
              <span>Hawkish</span>
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
            leftLabel="Bearish"
            rightLabel="Bullish"
          />
        )}
      </div>
    </Card>
  );
}


/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function MacroPage() {
  const [filter, setFilter] = useState<MacroFilter>("All");
  const [desk, setDesk] = useState<MacroDesk | null>(null);
  const [fng, setFng] = useState<FearGreed | null>(null);
  const clock = useLocalClock();

  useEffect(() => {
    trackPageLoad("macro");
    const stop = trackEngagement();
    let alive = true;
    fetchMacroDesk().then((d) => alive && setDesk(d));
    fetchFearGreed().then((f) => alive && setFng(f));
    return () => {
      alive = false;
      stop?.();
    };
  }, []);

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
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">
                MacroTrader desk
              </p>
              <h1 className="mt-1 text-3xl font-black sm:text-4xl">Macro & Crypto</h1>
              <p className="mt-2 max-w-xl text-sm text-body">
                The desk that reads the calendar, the central banks and the crypto tape overnight,
                then posts the briefing to Telegram every morning.
              </p>
            </div>
          </div>

          <dl className="shrink-0 space-y-1.5 text-sm md:text-right">
            <div>
              <dt className="inline text-muted-foreground">Daily digest · </dt>
              <dd className="inline font-semibold">
                {digest} {clock.ready ? clock.tzLabel : "EST"}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Whale polling · </dt>
              <dd className="inline font-semibold">every 20 min</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Your timezone · </dt>
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
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main column */}
          <div className="min-w-0 space-y-7">
            {shows("Calendar") ? (
              <Card
                title="Today's Economic Calendar"
                badge={<Badge tone="free">{MACRO_PRICES.calendar}</Badge>}
                note={`Times shown in ${clock.ready ? clock.tzLabel : "EST"}`}
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11.5px]">
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                      {(["high", "medium", "low"] as const).map((i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 capitalize">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: IMPACT_COLOR[i] }}
                          />
                          {i} impact
                        </span>
                      ))}
                    </div>
                    <a
                      href={FOREXFACTORY}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("click", "macro_forexfactory")}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      Cross-check on ForexFactory <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <div
                    className="grid gap-x-3 text-left text-sm"
                    style={{ gridTemplateColumns: "56px 52px minmax(0, 1fr) 78px 78px" }}
                  >
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">Time</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">Ccy</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">Event</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 text-right font-bold">Forecast</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 text-right font-bold">Previous</div>
                    {desk?.calendar.map((r) => (
                      <Fragment key={`${r.nyTime}-${r.event}`}>
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
                </div>
              </Card>
            ) : null}

            {shows("Central Banks") ? (
              <Card
                title="Central Bank Policy Divergence"
                badge={<Badge tone="paid">Heatmaps · {MACRO_PRICES.heatmaps}</Badge>}
                footer={
                  <p className="text-[11.5px] text-muted-foreground">
                    The bigger the divergence between two banks' stances, the stronger the trend
                    tends to be in their currency pair.
                  </p>
                }
              >
                <div className="overflow-x-auto">
                  <div
                    className="grid gap-x-3 text-left text-sm"
                    style={{ gridTemplateColumns: "minmax(0, 1fr) 72px minmax(90px, 150px) 86px" }}
                  >
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">Central bank</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">Rate</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">Stance</div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 text-right font-bold">Next meeting</div>
                    {desk?.centralBanks.map((b) => (
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
                    Track reads dovish (left) → hawkish (right).
                  </p>
                </div>
              </Card>
            ) : null}

            {shows("Recession") ? (
              <Card
                title="Recession Probability"
                subtitle="Next 12 months"
                badge={<Badge tone="paid">Heatmaps · {MACRO_PRICES.heatmaps}</Badge>}
                footer={
                  <p className="text-[11.5px] text-muted-foreground">
                    Higher recession odds typically favour safe-haven assets (gold, USD, JPY) over
                    risk assets.
                  </p>
                }
              >
                <div
                  className="grid gap-x-3 text-left text-sm"
                  style={{ gridTemplateColumns: "minmax(0, 150px) 52px minmax(80px, 140px) minmax(0, 1fr)" }}
                >
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">Country</div>
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 text-right font-bold">Prob</div>
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">Gauge</div>
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground pb-2 font-bold">Driver</div>
                  {desk?.recession.map((r) => (
                    <Fragment key={r.country}>
                      <div className="border-t border-border py-2.5 text-sm font-semibold">{r.country}</div>
                      <div
                        className="border-t border-border py-2.5 text-right text-sm font-bold"
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
                {desk?.trends.map((t) => (
                  <TrendCard key={t.key} trend={t} />
                ))}
              </div>
            ) : null}

            {shows("Crypto") ? (
              <Card title="Crypto Desk" note="Add-ons, billed separately">
                <div className="grid gap-4 sm:grid-cols-2">
                  {desk?.cryptoAddons.map((a) => (
                    <div
                      key={a.name}
                      className="flex flex-col rounded-lg border border-border bg-surface/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{a.name}</p>
                        <span className="shrink-0 text-xs font-bold text-accent">{a.price}</span>
                      </div>
                      <p className="mt-1 flex-1 text-xs text-muted-foreground">{a.description}</p>
                      <BuyButton sku={a.sku} label="Pay with card" className="mt-3" />
                      <a
                        href={LINKS.macro}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          track("click", `macro_crypto_telegram_${a.name.toLowerCase().replace(/\s+/g, "_")}`)
                        }
                        className="mt-2 text-center text-xs font-semibold text-muted-foreground hover:text-primary hover:underline"
                      >
                        or subscribe via Telegram
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="space-y-7">
            <Card
              title="Crypto Fear & Greed"
              badge={<Badge tone="free">{MACRO_PRICES.calendar}</Badge>}
              footer={
                <p className="text-[11.5px] text-muted-foreground">
                  Updated daily · {fng?.source ?? "alternative.me"}
                </p>
              }
            >
              <p className="text-4xl font-black">
                {fng?.value ?? "—"}
                <span className="text-base font-semibold text-muted-foreground">/100</span>
              </p>
              <p className="mt-1 text-sm font-bold text-accent">{fng?.label ?? "Loading"}</p>
              <div className="mt-3">
                <FillBar percent={fng?.value ?? 0} color="#c9a13a" height={8} />
                <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <span>Fear</span>
                  <span>Greed</span>
                </div>
              </div>

            </Card>

            <Card title="Next Rate Decisions">
              <ul className="space-y-2.5 text-sm">
                {desk?.rateDecisions.map((d) => (
                  <li key={d.bank} className="flex items-center justify-between gap-3">
                    <span className="text-body">{d.bank}</span>
                    <span className="font-semibold">{d.date}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <section className="rounded-xl border border-accent/45 bg-card p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent">
                Full macro desk
              </p>
              <p className="mt-2 text-2xl font-black">
                $19<span className="text-sm font-semibold text-muted-foreground">/month</span>
              </p>
              <p className="mt-2 text-sm text-body">
                Unlocks all four premium heatmaps — central bank divergence, recession probability,
                asset correlation and geopolitical risk — delivered daily at{" "}
                {clock.ready ? `${digest} ${clock.tzLabel}` : "08:00 EST"}, your local digest time.
              </p>
              <BuyButton sku="macro_full_desk" label="Pay with card — $19/mo" variant="gold" className="mt-4" />
              <a
                href={LINKS.macro}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("click", "macro_subscribe")}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-body transition-colors hover:border-accent/50 hover:text-foreground"
              >
                <Send className="h-4 w-4" /> Subscribe via Telegram
              </a>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Card, Telegram Stars or USDT · cancel anytime
              </p>
            </section>

            <div className="rounded-xl border border-border bg-surface p-5 text-[11.5px] leading-relaxed text-muted-foreground">
              Macro data is provided for education and research only and is not personalized
              investment advice. Figures come from third-party sources and may be delayed or
              revised — cross-check against{" "}
              <a
                href={FOREXFACTORY}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ForexFactory
              </a>{" "}
              before acting. Trading carries a risk of loss.
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
