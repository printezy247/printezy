import { imgProps } from "@/lib/responsive-images";
import { NextStepAdvisor } from "./NextStepAdvisor";
import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState } from "react";
import mt5LogoAsset from "@/assets/mt5-logo.png";
import { EzyAiLogo } from "@/components/brand/EzyAiLogo";
import { PointerGlyphs } from "./PointerGlyphs";
import { DEMO, useDemoPrice, type DemoPrice } from "@/lib/use-demo-price";
import { EZYAI_BOARD_VISIBLE } from "@/lib/ezyai/visibility";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getActiveMemberCount } from "@/lib/member-count.functions";
import { useTranslation, useLocale, localizePath } from "@/lib/i18n";
import { LOCALES, LOCALE_LABELS, LOCALE_FLAGS, LOCALE_NATIVE_NAMES } from "@/lib/locale-constants";
import { LiveSampleSignal } from "./LiveSampleSignal";
import type { TranslationKey } from "@/lib/translations";
import { useCountUp } from "@/lib/use-count-up";
import { BuyButton } from "@/components/BuyButton";
import { Button } from "@/components/ui/button";
import { PreLandingSection } from "./PreLandingSection";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { Tools } from "@/components/landing/Tools";
import { Faq } from "./FaqSection";
import { Reveal, Section, SectionHeading } from "./primitives";
import { Footer, Nav, useBotLink } from "./SiteChrome";

const EbookDetailsModal = lazy(() =>
  import("@/components/EbookDetailsModal").then((m) => ({ default: m.EbookDetailsModal })),
);
import {
  Zap,
  GraduationCap,
  Users,
  Smartphone,
  Send,
  Check,
  Star,
  ArrowRight,
  Clock,
  Activity,
  BookOpen,
  Lock,
} from "lucide-react";
import {
  trackPageLoad,
  trackEngagement,
  trackSectionVisibility,
  trackAdClick,
  getSessionId,
  metaTrack,
  goTrack,
  trackWebVitals,
} from "@/lib/analytics";
import { EBOOK_COVER_MAPPING, EBOOK_COVER_TECHNICAL } from "@/lib/ebooks";
import { LINKS } from "@/lib/links";
import { formatLocalPriceEstimate } from "@/lib/locale-pricing";
import { getLocaleFxRates } from "@/lib/locale-pricing.functions";
export { LINKS } from "@/lib/links";

const jackPhoto = "/__l5e/assets-v1/a88ab471-0335-452e-86ce-a8f7301811e3/jack-photo.png";
/** Exported for reuse as og:image on routes that don't have a more specific banner. */
const brandLogo = "/__l5e/assets-v1/1d73bbe2-5c3b-4399-8e48-1eace4a5ed77/ezymap-logo.png";
const macroLogo = "/__l5e/assets-v1/398fbb63-d47e-4553-8892-9dfb7bda17d4/macro-logo.png";

/** Imported, not copied: one place to swap a cover (see lib/ebooks.ts). */
const ebookMapping = EBOOK_COVER_MAPPING;
const ebookTechnical = EBOOK_COVER_TECHNICAL;

const tierFree = "/__l5e/assets-v1/174daaab-2584-456e-a536-500846c6e53a/tier-beginner.jpg";

const tierPro = "/__l5e/assets-v1/b081a13c-b17d-495f-addf-bf83f9f20930/tier-pro.jpg";
const tierPremium = "/__l5e/assets-v1/aed9ef52-2740-4a48-83db-2b807a45e958/tier-premium.jpg";
const tierElite = "/__l5e/assets-v1/74dd6c4b-6aa9-466c-89ab-b1e0b75b28ac/tier-elite.jpg";

const tradingViewLogo = "https://s3.tradingview.com/userpics/6171439-mFQX_big.png";
const mt5Logo = mt5LogoAsset;

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

/**
 * Bot links carry `?start=<sessionId>` so the Telegram bot can look the
 * visitor's fbclid back up. sessionId only exists client-side, so render the
 * plain href on first paint and swap it in after mount (no hydration mismatch).
 */
/**
 * Live Telegram channel member count (falls back to 640 while loading or on
 * fetch failure), fetched once at the page root and shared everywhere the
 * site quotes the community size instead of leaving it hardcoded.
 */
const FALLBACK_MEMBER_COUNT = 640;
const MemberCountContext = createContext(FALLBACK_MEMBER_COUNT);

function useMemberCount() {
  const target = useContext(MemberCountContext);
  const count = useCountUp(target);
  return { count, formatted: `${count}+` };
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function TelegramCta({
  label = "Join Free Channel",
  event,
  variant = "primary",
  href = LINKS.freeChannel,
  className = "",
}: {
  label?: string;
  event: string;
  variant?: "primary" | "gold" | "outline";
  href?: string;
  className?: string;
}) {
  return (
    <Button asChild variant={variant === "primary" ? "primary" : "outline"} className={className}>
      <a href={href} onClick={() => goTrack(event)}>
        <Send className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}

function SupportCta({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Button asChild variant="outline" size="sm" className={className}>
      <a href={LINKS.support} onClick={() => goTrack("support_click")}>
        <Send className="h-4 w-4" /> {t("nav_ask_sarah")}
      </a>
    </Button>
  );
}

function NeonFreeAccessButton({ href, event }: { href: string; event: string }) {
  return (
    <div className="flex justify-center">
      <a
        href={href}
        onClick={() => goTrack(event)}
        className="neon-free-btn neon-free-btn--compact"
      >
        <span className="neon-free-btn-inner">Get Free Access</span>
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

/* The hero chart's own frame. The plot band is inset from the viewBox so wicks
   and the level tags have room, and the aspect matches the 16/7 box the card
   gives it — which is what lets the SVG fill edge to edge instead of sitting
   letterboxed inside its own padding at wide widths. */
const CHART = { w: 480, h: 210, top: 40, bottom: 178, left: 20, right: 460 };

/* The price window the chart draws. Headroom under the entry and over the
   target, so neither level tag sits welded to an edge. */
const BAND = DEMO.target - DEMO.entry;
const CHART_LO = DEMO.entry - BAND * 0.35;
const CHART_HI = DEMO.target + BAND * 0.12;

/** A plausible approach into the entry, so the chart opens mid-story. */
const SEED = [
  4598.05, 4598.42, 4598.28, 4598.9, 4599.15, 4599.02, 4599.6, 4599.95, 4599.78, 4600.4, 4600.72,
  4600.5,
];

function ChartGraphic({ live }: { live: DemoPrice }) {
  // A rolling window over the same walk the card's rail is reading. Each tick
  // pushes the newest price on the right and drops the oldest off the left, so
  // the series slides rather than redrawing from nothing — and the last candle
  // is always the price shown above it.
  //
  // It stores prices rather than plot heights, which is what lets the entry and
  // target rules below be drawn from the same numbers the panels quote instead
  // of from a second set that has to be kept in step by hand.
  const series = useRef<number[]>(SEED);
  const lastTick = useRef(-1);

  if (live.tick !== lastTick.current) {
    lastTick.current = live.tick;
    if (live.tick > 0) series.current = [...series.current.slice(1), live.price];
  }

  const prices = series.current;
  const step = (CHART.right - CHART.left) / (prices.length - 1);
  const x = (i: number) => CHART.left + i * step;
  const y = (price: number) =>
    CHART.bottom -
    ((Math.max(CHART_LO, Math.min(CHART_HI, price)) - CHART_LO) / (CHART_HI - CHART_LO)) *
      (CHART.bottom - CHART.top);

  const line = prices.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p)}`).join(" ");
  const lastX = x(prices.length - 1);
  const lastY = y(prices[prices.length - 1]);
  const entryY = y(DEMO.entry);
  const targetY = y(DEMO.target);

  return (
    <svg
      viewBox={`0 0 ${CHART.w} ${CHART.h}`}
      className="h-full w-full"
      role="img"
      aria-label="Sample uptrend, with the entry and first target marked"
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Instrument grid, kept faint: it is there to give the prices a frame,
          not to be read off. */}
      {[52, 94, 136, 178].map((gy) => (
        <line key={gy} x1="0" y1={gy} x2={CHART.w} y2={gy} stroke="var(--border)" strokeWidth="1" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={`v${i}`}
          x1={(CHART.w / 5) * i}
          y1="0"
          x2={(CHART.w / 5) * i}
          y2={CHART.h}
          stroke="var(--border)"
          strokeWidth="1"
          opacity="0.4"
        />
      ))}

      {/* The two levels the card quotes, drawn where they actually fall. */}
      <line
        x1="0"
        y1={entryY}
        x2={CHART.right - 62}
        y2={entryY}
        stroke="var(--foreground)"
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity="0.4"
      />
      <text
        x={CHART.w - 8}
        y={entryY - 5}
        textAnchor="end"
        fontSize="10"
        fontWeight="700"
        letterSpacing="0.08em"
        fill="var(--muted-foreground)"
      >
        ENTRY
      </text>
      <line
        x1="0"
        y1={targetY}
        x2={CHART.right - 62}
        y2={targetY}
        stroke="var(--primary)"
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity="0.55"
      />
      <text
        x={CHART.w - 8}
        y={targetY - 5}
        textAnchor="end"
        fontSize="10"
        fontWeight="700"
        letterSpacing="0.08em"
        fill="var(--primary)"
      >
        TP1
      </text>

      <path
        className="hero-series"
        d={`${line} L${lastX},${CHART.h} L${CHART.left},${CHART.h} Z`}
        fill="url(#areaFill)"
      />
      <path
        className="hero-series"
        d={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {prices.map((p, i) => {
        // The newest candle takes the direction of the live tick; the rest keep
        // a stable pattern so the history does not flicker colour every second.
        const up = i === prices.length - 1 ? live.rising : i % 3 !== 1;
        const color = up ? "var(--primary)" : "var(--accent)";
        return (
          <g key={i}>
            <line
              className="hero-wick"
              x1={x(i)}
              y1={y(p) - 13}
              x2={x(i)}
              y2={y(p) + 13}
              stroke={color}
              strokeWidth="1.5"
              opacity="0.65"
            />
            <rect
              className="hero-candle"
              x={x(i) - 4.5}
              y={y(p) - 7}
              width="9"
              height="14"
              rx="2"
              fill={color}
              opacity="0.85"
            />
          </g>
        );
      })}

      <circle
        className="hero-marker hero-marker-halo"
        cx={lastX}
        cy={lastY}
        r="4"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
      />
      <circle className="hero-marker" cx={lastX} cy={lastY} r="4" fill="var(--primary)" />
    </svg>
  );
}

function Hero() {
  const { formatted: memberCount } = useMemberCount();
  const { t, locale } = useTranslation();
  // One walk, two readers: the chart and the card's rail.
  const live = useDemoPrice();
  return (
    <>
      <section className="bg-hero relative overflow-hidden border-b border-border">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-glow" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-10%] top-1/2 hidden h-[620px] w-[620px] -translate-y-1/2 rounded-full bg-primary/15 blur-[120px] lg:block"
        />
        <PointerGlyphs />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 text-center sm:gap-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_1fr] lg:gap-8 lg:px-8 lg:py-10 xl:py-20 xl:grid-cols-[1.05fr_1fr] xl:gap-14 [@media(max-height:500px)]:py-8 lg:text-left">
          <div className="mx-auto max-w-xl lg:mx-0">
            <span className="hero-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-body">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono font-extrabold tabular-nums text-primary">
                {memberCount}
              </span>{" "}
              {t("hero_badge")}
            </span>
            <h1 className="text-glow mt-5 [@media(min-width:640px)_and_(max-width:1279px)]:mt-3 text-[34px] font-bold uppercase leading-[0.98] tracking-tight text-foreground min-[400px]:text-[38px] sm:text-[42px] lg:text-[44px] xl:text-[60px] [@media(max-height:500px)]:text-[32px]">
              {t("hero_title")}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-body sm:text-lg [@media(min-width:640px)_and_(max-width:1279px)]:mt-3 [@media(min-width:640px)_and_(max-width:1279px)]:text-base">
              {t("hero_subtitle")}
            </p>

            <div className="mt-8 [@media(min-width:640px)_and_(max-width:1279px)]:mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/free-channel"
                onClick={() => goTrack("hero_join_free")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-glow"
              >
                <Send className="h-4 w-4" /> {t("hero_cta_join")}
              </Link>
              <a
                href={`${localizePath("/home", locale)}#packages`}
                onClick={() => goTrack("hero_see_packages")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:bg-primary/10"
              >
                {t("hero_cta_packages")}
              </a>
            </div>

            <p className="mt-4 [@media(min-width:640px)_and_(max-width:1279px)]:mt-3 text-sm text-muted-foreground">
              <Link
                to="/ebooks/$slug"
                params={{ slug: "technical-analysis" }}
                onClick={() => goTrack("hero_free_ebook")}
                className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5" /> {t("hero_cta_ebook")}
              </Link>
            </p>

            <dl className="mx-auto mt-10 [@media(min-width:640px)_and_(max-width:1279px)]:mt-5 grid max-w-lg grid-cols-3 gap-2 sm:gap-3 lg:mx-0">
              {[
                [memberCount, t("hero_stat_members")],
                ["24/5", t("hero_stat_coverage")],
                ["3 Styles", t("hero_stat_styles")],
              ].map(([v, l]) => (
                <div key={l} className="glow-ring rounded-2xl bg-card/70 px-4 py-3.5 backdrop-blur">
                  <dt className="font-mono text-xl font-extrabold tabular-nums text-foreground">
                    {v}
                  </dt>
                  <dd className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-xl text-left">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-primary/20 blur-3xl"
            />
            <div className="relative">
              <LiveSampleSignal chart={<ChartGraphic live={live} />} live={live} />
              {/* This card is a demo walk, not the desk. When the real board
                  is open, point at it so nobody mistakes the sample for live
                  data — and so a buyer can jump straight to the real thing. */}
              {EZYAI_BOARD_VISIBLE ? (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  <a
                    href={localizePath("/ezyai", locale)}
                    className="underline underline-offset-2 transition-colors hover:text-foreground"
                    onClick={() => goTrack("hero_see_live_board")}
                  >
                    {t("ezyai_see_live_board")} →
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip                                                         */
/* ------------------------------------------------------------------ */

const PLATFORMS = ["Telegram", "TradingView", "Vantage Markets", "ForexFactory"];

function TrustStrip() {
  const { t } = useTranslation();
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {t("trust_strip_label")}
        </span>
        {PLATFORMS.map((p) => (
          <span key={p} className="text-[12.5px] font-bold uppercase tracking-wide text-body">
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats strip                                                         */
/* ------------------------------------------------------------------ */

function StatsStrip() {
  const { formatted: memberCount } = useMemberCount();
  const { t } = useTranslation();
  const stats: [string, string][] = [
    [memberCount, t("stats_members")],
    ["24/5", t("stats_coverage")],
    ["6", t("stats_languages")],
    ["2021", t("stats_since")],
  ];
  return (
    <div className="border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map(([value, label]) => (
          <div key={label} className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl font-extrabold tabular-nums text-foreground">
              {value}
            </span>
            <span className="text-gradient-brand max-w-[8.5rem] text-[11px] font-bold uppercase leading-tight tracking-[0.14em]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Showcase — alternating image / text rows                            */
/* ------------------------------------------------------------------ */

type ShowcaseRow = {
  image: string;
  alt: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  ctaKey: TranslationKey;
  /** Site path (locale prefix is added) or an in-page anchor. */
  href: string;
  event: string;
};

const SHOWCASE: ShowcaseRow[] = [
  {
    image: tierPremium,
    alt: "Premium signal package preview",
    titleKey: "show_signals_title",
    bodyKey: "show_signals_body",
    ctaKey: "show_signals_cta",
    href: "#packages",
    event: "showcase_signals",
  },
  {
    image: ebookTechnical,
    alt: "Technical Analysis ebook cover",
    titleKey: "show_learn_title",
    bodyKey: "show_learn_body",
    ctaKey: "show_learn_cta",
    href: "/ebooks/technical-analysis",
    event: "showcase_ebook",
  },
  {
    image: macroLogo,
    alt: "MacroTrader desk logo",
    titleKey: "show_macro_title",
    bodyKey: "show_macro_body",
    ctaKey: "show_macro_cta",
    href: "/macro",
    event: "showcase_macro",
  },
];

function Showcase() {
  const { t, locale } = useTranslation();
  return (
    <Section id="showcase">
      <SectionHeading eyebrow={t("show_eyebrow")} title={t("show_title")} />
      <div className="space-y-14 sm:space-y-20">
        {SHOWCASE.map((row, i) => {
          const href = row.href.startsWith("#") ? row.href : localizePath(row.href, locale);
          return (
            <Reveal key={row.titleKey}>
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
                <div>
                  <span className="gradient-tick" aria-hidden="true" />
                  <h3 className="mt-4 text-2xl sm:text-3xl">{t(row.titleKey)}</h3>
                  <p className="mt-3 max-w-md text-base text-body">{t(row.bodyKey)}</p>
                  <a
                    href={href}
                    onClick={() => goTrack(row.event)}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    {t(row.ctaKey)} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
                <div className={i % 2 === 1 ? "md:order-first" : ""}>
                  <div className="glass-card card-lift flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[#0a0c0b] p-6">
                    <img
                      {...imgProps(row.image)}
                      alt={row.alt}
                      loading="lazy"
                      className="max-h-full max-w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Gradient CTA band                                                   */
/* ------------------------------------------------------------------ */

function CtaBand() {
  const { t, locale } = useTranslation();
  return (
    <section id="cta-band" className="py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="cta-band flex flex-col items-start gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/70">
                {t("band_eyebrow")}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-black sm:text-3xl">{t("band_title")}</h3>
              <p className="mt-2 max-w-xl text-sm text-black/75">{t("band_body")}</p>
            </div>
            <a
              href={EZYAI_BOARD_VISIBLE ? localizePath("/ezyai", locale) : LINKS.ezyai}
              target={EZYAI_BOARD_VISIBLE ? undefined : "_blank"}
              rel={EZYAI_BOARD_VISIBLE ? undefined : "noopener noreferrer"}
              onClick={() => goTrack("band_ezyai")}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#0a0c0b] px-6 py-3 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5"
            >
              {t("band_cta")} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Track record                                                        */
/* ------------------------------------------------------------------ */

function TrackRecord() {
  const { t } = useTranslation();
  return (
    <Section id="track-record" className="bg-surface">
      <SectionHeading
        eyebrow={t("track_record_eyebrow")}
        title={t("track_record_title")}
        subtitle={t("track_record_subtitle")}
      />
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
        <a
          href={LINKS.freeChannel}
          onClick={() => goTrack("track_record_telegram")}
          className="flex h-full flex-col rounded-md border border-border bg-card p-5 transition-colors hover:border-primary"
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary">
            {t("track_record_telegram_eyebrow")}
          </p>
          <h3 className="mt-2 text-lg font-bold">{t("track_record_telegram_title")}</h3>
          <p className="mt-2 flex-1 text-sm text-body">{t("track_record_telegram_body")}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            {t("track_record_telegram_cta")} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </a>
        <a
          href="https://www.forexfactory.com/calendar"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => goTrack("track_record_forexfactory")}
          className="flex h-full flex-col rounded-md border border-border bg-card p-5 transition-colors hover:border-accent"
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent">
            {t("track_record_ff_eyebrow")}
          </p>
          <h3 className="mt-2 text-lg font-bold">{t("track_record_ff_title")}</h3>
          <p className="mt-2 flex-1 text-sm text-body">{t("track_record_ff_body")}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            {t("track_record_ff_cta")} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </a>
      </div>
      <p className="mx-auto mt-5 max-w-4xl text-xs leading-relaxed text-muted-foreground">
        {t("track_record_disclaimer")}
      </p>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { icon: Zap, titleKey: "feature_signals_title", bodyKey: "feature_signals_body" },
  { icon: GraduationCap, titleKey: "feature_education_title", bodyKey: "feature_education_body" },
  { icon: Users, titleKey: "feature_community_title", bodyKey: "feature_community_body" },
  { icon: Smartphone, titleKey: "feature_mobile_title", bodyKey: "feature_mobile_body" },
] as const;

function Features() {
  const { formatted: memberCount } = useMemberCount();
  const { t } = useTranslation();
  return (
    <Section id="features">
      <SectionHeading
        eyebrow={t("features_eyebrow")}
        title={t("features_title")}
        subtitle={t("features_subtitle")}
      />
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.titleKey} delay={i * 0.04} className="h-full">
            <article className="glass-card card-lift h-full rounded-xl p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <span className="gradient-tick mt-4" aria-hidden="true" />
              <h3 className="mt-2 text-lg font-semibold">{t(f.titleKey)}</h3>
              <p className="mt-2 text-sm text-body">
                {t(f.bodyKey).replace("{memberCount}", memberCount)}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Packages                                                            */
/* ------------------------------------------------------------------ */

type Tier = {
  name: string;
  blurbKey: TranslationKey;
  featureKeys: TranslationKey[];
  href: string;
  /** Catalog SKU (see src/lib/catalog.ts) — Enroll Now deep-links to this card on /pricing. */
  sku: string;
  event: string;
  highlight?: boolean;
  image?: string;
  price: string;
  priceNote?: string;
  /** Paid tiers also offer the no-card Vantage activation route. */
  freeAlt?: boolean;
  /** Optional "Open Your Account" affiliate link shown above the main CTA. */
  openAccountHref?: string;
  openAccountEvent?: string;
};

const TIERS: Tier[] = [
  {
    name: "Beginner",
    price: "$29",
    priceNote: "one-time",
    blurbKey: "tier_beginner_blurb",
    featureKeys: [
      "tier_beginner_f1",
      "tier_beginner_f2",
      "tier_beginner_f3",
      "tier_enroll_via_bot",
    ],
    href: LINKS.bot,
    sku: "signal_beginner",
    event: "pricing_beginner",
    image: tierFree,
    freeAlt: true,
  },
  {
    name: "Pro",
    price: "$49",
    priceNote: "one-time",
    blurbKey: "tier_pro_blurb",
    featureKeys: ["tier_pro_f1", "tier_pro_f2", "tier_enroll_via_bot"],
    href: LINKS.bot,
    sku: "signal_pro",
    event: "pricing_pro",
    image: tierPro,
    freeAlt: true,
  },
  {
    name: "Premium",
    price: "$99",
    priceNote: "one-time",
    blurbKey: "tier_premium_blurb",
    featureKeys: ["tier_premium_f1", "tier_premium_f2", "tier_premium_f3", "tier_enroll_via_bot"],
    href: LINKS.bot,
    sku: "signal_premium",
    event: "pricing_premium",
    highlight: true,
    image: tierPremium,
    freeAlt: true,
  },
  {
    name: "Elite",
    price: "$299",
    priceNote: "one-time",
    blurbKey: "tier_elite_blurb",
    featureKeys: [
      "tier_elite_f1",
      "tier_elite_f2",
      "tier_elite_f3",
      "tier_elite_f4",
      "tier_enroll_via_bot",
    ],
    href: LINKS.bot,
    sku: "signal_elite",
    event: "pricing_elite",
    image: tierElite,
    freeAlt: true,
  },
];

function Pricing() {
  const botHref = useBotLink();
  const { formatted: memberCount } = useMemberCount();
  const { t: tt, locale } = useTranslation();
  const fetchFxRates = useServerFn(getLocaleFxRates);
  const [fxRates, setFxRates] = useState<Awaited<ReturnType<typeof getLocaleFxRates>>>(null);
  const [fxLoaded, setFxLoaded] = useState(false);
  useEffect(() => {
    if (locale !== "ms" && locale !== "hi" && locale !== "ar") return;
    let active = true;
    void fetchFxRates({ data: undefined })
      .then((rates) => {
        if (!active) return;
        setFxRates(rates);
        setFxLoaded(true);
      })
      .catch(() => active && setFxLoaded(true));
    return () => {
      active = false;
    };
  }, [fetchFxRates, locale]);
  return (
    <Section id="packages" className="bg-surface/40">
      <SectionHeading
        eyebrow={tt("pricing_eyebrow")}
        title={tt("pricing_title")}
        subtitle={tt("pricing_subtitle")}
      />
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.04} className="h-full">
            <article
              id={t.sku}
              className={`card-lift relative flex h-full scroll-mt-24 flex-col overflow-hidden rounded-xl ${
                t.highlight
                  ? "border border-accent/60 bg-surface-elevated shadow-elevated ring-1 ring-accent/15 lg:-translate-y-1.5"
                  : "glass-card"
              }`}
            >
              {t.highlight ? (
                <div className="bg-gold absolute inset-x-0 top-0 z-10 h-[3px]" aria-hidden="true" />
              ) : null}
              {t.image ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0a0c0b]">
                  {t.highlight ? (
                    <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent backdrop-blur-md shadow-lg">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {tt("pricing_most_popular")}
                    </span>
                  ) : null}
                  <img
                    {...imgProps(t.image)}
                    alt={`${t.name} package preview`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0a0c0b]/90 to-transparent" />
                </div>
              ) : (
                <div className="bg-metal relative aspect-[16/9] w-full overflow-hidden border-b border-border">
                  {t.highlight ? (
                    <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent backdrop-blur-md shadow-lg">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {tt("pricing_most_popular")}
                    </span>
                  ) : null}
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t.name}
                </h3>
                <p className="mt-2 flex items-baseline justify-center gap-1.5 text-center">
                  <span className="font-mono text-2xl font-extrabold tracking-tight tabular-nums text-foreground">
                    {t.price}
                  </span>
                  {fxLoaded
                    ? (() => {
                        const estimate = formatLocalPriceEstimate(
                          Number(t.price.replace(/[^0-9.]/g, "")) * 100,
                          locale,
                          fxRates?.quotes ?? {},
                        );
                        return estimate ? (
                          <span
                            className="text-xs text-muted-foreground"
                            title="Daily reference-rate estimate; checkout is charged in USD"
                          >
                            ≈ {estimate} estimate
                          </span>
                        ) : null;
                      })()
                    : null}
                  {t.priceNote ? (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.priceNote}
                    </span>
                  ) : null}
                </p>
                {t.freeAlt ? (
                  <p className="mt-1 text-center text-[11px] font-medium leading-snug text-accent">
                    {tt("pricing_free_alt")}
                  </p>
                ) : (
                  <p className="mt-1 h-4" aria-hidden="true" />
                )}
                <p className="mt-2 text-center text-sm font-semibold text-body">
                  {tt(t.blurbKey).replace("{memberCount}", memberCount)}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {t.featureKeys.map((fk) => (
                    <li key={fk} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-body">
                        {tt(fk).replace("{memberCount}", memberCount)}
                      </span>
                    </li>
                  ))}
                </ul>
                {t.openAccountHref ? (
                  <div className="mt-6 flex justify-center">
                    <a
                      href={t.openAccountHref}
                      onClick={() => {
                        if (t.openAccountEvent) goTrack(t.openAccountEvent);
                      }}
                      className="neon-free-btn neon-pearl neon-free-btn--compact"
                    >
                      <span className="neon-free-btn-inner">Open Account</span>
                    </a>
                  </div>
                ) : null}

                <div
                  className={t.openAccountHref ? "mt-2" : "mt-6"}
                  onClickCapture={() => goTrack(t.event)}
                >
                  <BuyButton sku={t.sku} label={tt("pricing_cta")} inlineForm />
                </div>
                <p className="mt-1.5 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> Secured by Stripe
                </p>
                {t.freeAlt ? (
                  t.name === "Premium" ? (
                    <div className="mt-2">
                      <NeonFreeAccessButton href={botHref} event={`${t.event}_free_access`} />
                    </div>
                  ) : (
                    <div className="mt-2 flex justify-center">
                      <Button asChild variant="outline" size="sm" className="min-w-[168px]">
                        <a href={botHref} onClick={() => goTrack(`${t.event}_free_access`)}>
                          Get Free Access
                        </a>
                      </Button>
                    </div>
                  )
                ) : null}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        {tt("pricing_duration_note")}
      </p>
      <div className="mt-8 rounded-md border border-border bg-card p-5">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent">
          Risk &amp; affiliate disclosure
        </p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Trading forex, commodities and crypto carries a high level of risk and can result in the
          loss of all your capital. Signals and education provided by EzyMap Algo are for
          informational and educational purposes only and are not personalized financial advice.
          Past performance is not indicative of future results.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Vantage Markets is our affiliate partner. We may earn a commission if you open an account
          through this link.
        </p>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Questions?{" "}
        <a
          href={LINKS.support}
          onClick={() => goTrack("pricing_support")}
          className="text-primary hover:underline"
        >
          Ask Sarah
        </a>{" "}
        for help choosing the right tier.
      </p>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

const EBOOKS = [
  {
    title: "Mapping Like A Pro",
    slug: "mapping-like-a-pro",
    image: ebookMapping,
    bulletKeys: ["ebook_mapping_b1", "ebook_mapping_b2", "ebook_mapping_b3"] as TranslationKey[],
  },
  {
    title: "Technical Analysis Ebook",
    slug: "technical-analysis",
    image: ebookTechnical,
    bulletKeys: [
      "ebook_technical_b1",
      "ebook_technical_b2",
      "ebook_technical_b3",
    ] as TranslationKey[],
  },
];

const TV_FEATURE_KEYS: TranslationKey[] = ["tv_feature_1", "tv_feature_2", "tv_feature_3"];

const MT5_FEATURE_KEYS: TranslationKey[] = [
  "mt5_feature_1",
  "mt5_feature_2",
  "mt5_feature_3",
  "mt5_feature_4",
];

const MACRO_FEATURE_KEYS: TranslationKey[] = [
  "macro_feature_1",
  "macro_feature_2",
  "macro_feature_3",
];

function Book3D({ image, title }: { image: string; title: string }) {
  return (
    <div className="book-3d aspect-[1240/1754] w-28 shrink-0 sm:w-32">
      <div className="book-back" aria-hidden="true" />
      <img {...imgProps(image)} alt={`${title} cover`} loading="lazy" className="book-cover" />
    </div>
  );
}

function Products() {
  const botHref = useBotLink();
  const [detailsSlug, setDetailsSlug] = useState<string | null>(null);
  const { t } = useTranslation();
  return (
    <Section id="products">
      <SectionHeading
        eyebrow={t("products_eyebrow")}
        title={t("products_title")}
        subtitle={t("products_subtitle")}
      />

      {/* Ebooks */}
      <div className="mb-14">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <h3 className="text-xl font-bold">{t("products_ebooks_heading")}</h3>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {EBOOKS.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.04}>
              <button
                type="button"
                onClick={() => {
                  goTrack(`ebook_${b.title.toLowerCase().replace(/\s+/g, "_")}`);
                  setDetailsSlug(b.slug);
                }}
                className="glass-card group flex h-full w-full items-stretch gap-4 overflow-hidden rounded-xl p-4 text-left transition-transform hover:-translate-y-1 sm:gap-5 sm:p-5"
              >
                <Book3D image={b.image} title={b.title} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <h4 className="text-base font-semibold leading-snug sm:text-lg">{b.title}</h4>
                  <ul className="mt-2 flex-1 space-y-1">
                    {b.bulletKeys.map((bulletKey) => (
                      <li
                        key={bulletKey}
                        className="flex items-start gap-2 text-xs text-body sm:text-sm"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
                        <span>{t(bulletKey)}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="mt-4 inline-flex items-center gap-1 rounded-md border border-accent/60 bg-accent/5 px-3 py-2 text-xs font-semibold text-accent transition-colors group-hover:bg-accent/10 sm:px-4 sm:text-sm">
                    {t("ebook_get_it_free")} <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {detailsSlug ? (
        <Suspense fallback={null}>
          <EbookDetailsModal slug={detailsSlug} onClose={() => setDetailsSlug(null)} />
        </Suspense>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* TradingView indicators */}
        <Reveal className="h-full">
          <article className="glass-card flex h-full flex-col rounded-xl p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#0a0c0b] p-1.5">
              <img
                src={tradingViewLogo}
                width={320}
                height={320}
                alt="TradingView logo"
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{t("products_tv_heading")}</h3>
            <ul className="mt-4 flex-1 space-y-2.5">
              {TV_FEATURE_KEYS.map((fk) => (
                <li key={fk} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-body">{t(fk)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-2 pt-5">
              <a
                href={botHref}
                onClick={() => goTrack("products_tv_enroll")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {t("pricing_cta")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Button asChild variant="outline">
                <a
                  href={LINKS.tradingView}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack("products_tv_open_free_account")}
                >
                  <img
                    src={tradingViewLogo}
                    width={320}
                    height={320}
                    alt=""
                    className="h-4 w-4 object-contain"
                  />
                  {t("products_open_free_account")}
                </a>
              </Button>
            </div>
          </article>
        </Reveal>

        {/* MT5 indicators */}
        <Reveal className="h-full" delay={0.1}>
          <article className="glass-card flex h-full flex-col rounded-xl p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#f4f1ea] p-1.5">
              <img
                {...imgProps(mt5Logo)}
                alt="MetaTrader 5 logo"
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{t("products_mt5_heading")}</h3>
            <ul className="mt-4 flex-1 space-y-2.5">
              {MT5_FEATURE_KEYS.map((fk) => (
                <li key={fk} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-body">{t(fk)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-2 pt-5">
              <a
                href={botHref}
                onClick={() => goTrack("products_mt5_enroll")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {t("pricing_cta")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Button asChild variant="outline">
                <a
                  href="https://www.metatrader5.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack("products_mt5_download")}
                >
                  {t("products_download_mt5")} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </article>
        </Reveal>

        {/* Macro & Fundamentals */}
        <Reveal className="h-full" delay={0.2}>
          <article className="glass-card relative flex h-full flex-col overflow-hidden rounded-xl p-6">
            <img
              {...imgProps(macroLogo)}
              alt="Gold, Forex & Crypto Macros"
              loading="lazy"
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full object-contain opacity-15"
            />
            <img
              {...imgProps(macroLogo)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-12 w-12 rounded-full object-contain ring-1 ring-accent/30"
            />
            <h3 className="mt-4 text-lg font-semibold">{t("products_macro_heading")}</h3>
            <ul className="mt-4 flex-1 space-y-2.5">
              {MACRO_FEATURE_KEYS.map((fk) => (
                <li key={fk} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-body">{t(fk)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-2 pt-5">
              <a
                href={LINKS.macro}
                onClick={() => goTrack("products_macro_join")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {t("products_join_macro_bot")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Button asChild variant="outline">
                <Link to="/macro" onClick={() => goTrack("products_macro_view")}>
                  {t("products_view_it_here")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </article>
        </Reveal>

        {/* EzyAI */}
        <Reveal className="h-full" delay={0.3}>
          <article className="glass-card relative flex h-full flex-col overflow-hidden rounded-xl p-6">
            <EzyAiLogo className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-15" />
            <EzyAiLogo className="h-12 w-12 rounded-full ring-1 ring-primary/30" title="EzyAI" />
            <h3 className="mt-4 text-lg font-semibold">{t("products_ezyai_heading")}</h3>
            <ul className="mt-4 flex-1 space-y-2.5">
              {(["ezyai_feature_1", "ezyai_feature_2", "ezyai_feature_3"] as TranslationKey[]).map(
                (fk) => (
                  <li key={fk} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-body">{t(fk)}</span>
                  </li>
                ),
              )}
            </ul>
            <div className="mt-auto flex flex-col gap-2 pt-5">
              <a
                href={LINKS.ezyai}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("products_ezyai_try_free")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {t("ezyai_try_free")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
              {EZYAI_BOARD_VISIBLE ? (
                <Button asChild variant="outline">
                  <Link to="/ezyai" onClick={() => goTrack("products_ezyai_view")}>
                    {t("products_view_it_here")} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

const STEPS: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: "how_step1_title", bodyKey: "how_step1_body" },
  { titleKey: "how_step2_title", bodyKey: "how_step2_body" },
  { titleKey: "how_step3_title", bodyKey: "how_step3_body" },
];

function HowItWorks() {
  const { t } = useTranslation();
  return (
    <Section id="how-it-works" className="bg-surface/40">
      <SectionHeading eyebrow={t("how_eyebrow")} title={t("how_title")} />
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.titleKey} className="h-full">
            <Reveal delay={i * 0.04} className="h-full">
              <div className="glass-card card-lift relative flex h-full flex-col rounded-xl p-6">
                <span className="font-display text-4xl font-bold text-accent/40">0{i + 1}</span>
                <span className="gradient-tick mt-2" aria-hidden="true" />
                <h3 className="mt-2 text-lg font-semibold">{t(s.titleKey)}</h3>
                <p className="mt-2 flex-1 text-sm text-body">{t(s.bodyKey)}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
      <div className="mt-10 text-center">
        <TelegramCta event="how_join_free" />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Ambassador                                                          */
/* ------------------------------------------------------------------ */

function Ambassador() {
  const { formatted: memberCount } = useMemberCount();
  const { t } = useTranslation();
  return (
    <Section id="ambassador">
      <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <div className="glass-card relative overflow-hidden rounded-xl p-8 text-center">
            <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full border-2 border-accent/40 shadow-gold">
              <img
                {...imgProps(jackPhoto)}
                alt="Jack, founder of EzyMap ALGO"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-5 text-lg font-semibold">Jack</p>
            <p className="text-sm text-muted-foreground">{t("ambassador_role")}</p>
            <p className="mt-3 text-xs text-muted-foreground">{t("ambassador_experience")}</p>
            <Button asChild variant="outline" size="sm" className="mt-5">
              <a href={LINKS.support} onClick={() => goTrack("ambassador_contact_sarah")}>
                <Send className="h-4 w-4" /> {t("ambassador_ask_sarah")}
              </a>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
              {t("ambassador_eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl">{t("ambassador_title")}</h2>
            <p className="mt-4 text-base text-body">{t("ambassador_bio")}</p>
            <blockquote className="mt-6 border-l-2 border-accent pl-4 text-lg italic text-foreground">
              "{t("ambassador_quote")}"
            </blockquote>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                [memberCount, t("ambassador_stat_students")],
                ["10+ yrs", t("ambassador_stat_trading")],
                ["24/5", t("ambassador_stat_coverage")],
              ].map(([v, l]) => (
                <div
                  key={l}
                  className="flex h-full flex-col rounded-xl border border-border bg-surface p-4"
                >
                  <dt className="font-mono text-xl font-bold tabular-nums text-accent">{v}</dt>
                  <dd className="text-xs uppercase tracking-wide text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Social proof                                                        */
/* ------------------------------------------------------------------ */

type Testimonial = {
  name: string;
  locale: "ms" | "en";
  roleKey: TranslationKey;
  quoteKey: TranslationKey;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Budi D.",
    locale: "ms",
    roleKey: "testimonial_budi_role",
    quoteKey: "testimonial_budi_quote",
  },
  {
    name: "Priya R.",
    locale: "en",
    roleKey: "testimonial_priya_role",
    quoteKey: "testimonial_priya_quote",
  },
  {
    name: "Luqman R.",
    locale: "ms",
    roleKey: "testimonial_luqman_role",
    quoteKey: "testimonial_luqman_quote",
  },
  {
    name: "Chen W.",
    locale: "en",
    roleKey: "testimonial_chen_role",
    quoteKey: "testimonial_chen_quote",
  },
];

function SocialProof() {
  const { formatted: memberCount } = useMemberCount();
  const { t, locale } = useTranslation();
  // Testimonials exist in en/ms only; other locales fall back to English
  // rather than rendering an empty section.
  const inLocale = TESTIMONIALS.filter((item) => item.locale === locale);
  const testimonials =
    inLocale.length > 0 ? inLocale : TESTIMONIALS.filter((i) => i.locale === "en");
  return (
    <Section id="testimonials" className="bg-surface/40">
      <SectionHeading
        eyebrow={t("social_eyebrow")}
        title={t("social_title").replace("{memberCount}", memberCount)}
        subtitle={t("social_subtitle")}
      />
      <div className="mb-10 grid gap-4">
        {[[Clock, "24/5", t("social_market_coverage")]].map(([Icon, v, l], i) => {
          const I = Icon as typeof Activity;
          return (
            <Reveal key={l as string} delay={i * 0.04}>
              <div className="glass-card mx-auto flex h-full max-w-xs items-center gap-4 rounded-xl p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <I className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-xl font-bold tabular-nums">{v as string}</p>
                  <p className="text-xs text-muted-foreground">{l as string}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>{" "}
      <div className="flex flex-wrap justify-center gap-5">
        {testimonials.map((item, i) => (
          <Reveal
            key={item.name}
            delay={i * 0.04}
            className="h-full w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)] lg:max-w-xs"
          >
            <figure className="glass-card flex h-full flex-col rounded-xl p-6">
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-sm text-body">
                "{t(item.quoteKey)}"
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{item.name}</span>
                <span className="block text-xs text-muted-foreground">{t(item.roleKey)}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCta() {
  const botHref = useBotLink();
  const { t } = useTranslation();
  return (
    <Section id="get-started" className="bg-surface/40">
      <Reveal>
        <div className="glass-card rounded-xl px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl sm:text-4xl">{t("final_title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-body">{t("final_body")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <TelegramCta event="final_join_free" className="px-7 py-3.5 text-base" />
            <TelegramCta
              label={t("final_enroll_via_bot")}
              event="final_enroll_bot"
              variant="gold"
              href={botHref}
              className="px-7 py-3.5 text-base"
            />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function Landing() {
  const [memberCount, setMemberCount] = useState(FALLBACK_MEMBER_COUNT);
  const getMemberCount = useServerFn(getActiveMemberCount);

  useEffect(() => {
    void getMemberCount({ data: undefined })
      .then((count) => setMemberCount(count))
      .catch(() => {
        // Keep the fallback — never let this block the homepage.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackPageLoad("landing");
    void trackWebVitals().catch(() => {});
    trackAdClick();
    // The site's own page view, reported to Meta through the same pipeline
    // as the bot events (consent-gated where required).
    metaTrack("PageView", { id: "landing" });
    const stopEngage = trackEngagement();
    const stopSections = trackSectionVisibility([
      "features",
      "packages",
      "showcase",
      "products",
      "cta-band",
      "how-it-works",
      "ambassador",

      "testimonials",
      "faq",
      "get-started",
    ]);
    return () => {
      stopEngage?.();
      stopSections?.();
    };
  }, []);

  return (
    <MemberCountContext.Provider value={memberCount}>
      <PreLandingSection />
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main>
          <Hero />
          <TrustStrip />
          <StatsStrip />
          <NextStepAdvisor />
          <Features />
          <Pricing />
          <Tools />
          <Showcase />
          <Products />
          <CtaBand />
          <HowItWorks />
          <TrackRecord />
          <SocialProof />
          <Ambassador />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
      </div>
      <StickyBuyBar />
    </MemberCountContext.Provider>
  );
}
