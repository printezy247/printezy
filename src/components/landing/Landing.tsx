import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import mt5LogoAsset from "@/assets/mt5-logo.png";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getActiveMemberCount } from "@/lib/member-count.functions";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { useCountUp } from "@/lib/use-count-up";
import { BuyButton } from "@/components/BuyButton";
import { Button } from "@/components/ui/button";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { Tools } from "@/components/landing/Tools";
import {
  Zap,
  GraduationCap,
  Users,
  Smartphone,
  Send,
  Check,
  Star,
  ArrowRight,
  ShieldCheck,
  Clock,
  Activity,
  ChevronDown,
  Menu,
  X,
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
} from "@/lib/analytics";

const jackPhoto = "/__l5e/assets-v1/a88ab471-0335-452e-86ce-a8f7301811e3/jack-photo.png";
/** Exported for reuse as og:image on routes that don't have a more specific banner. */
export const brandLogo = "/__l5e/assets-v1/1d73bbe2-5c3b-4399-8e48-1eace4a5ed77/ezymap-logo.png";
export const macroLogo = "/__l5e/assets-v1/398fbb63-d47e-4553-8892-9dfb7bda17d4/macro-logo.png";

const ebookMapping = "/__l5e/assets-v1/b177d46a-680e-4021-ae98-bcc3631ab665/ebook-mapping-like-pro.png";
const ebookTechnical = "/__l5e/assets-v1/eb540617-0a0b-4444-993e-d90be97af7d7/ebook-technical-analysis.png";

const tierFree = "/__l5e/assets-v1/174daaab-2584-456e-a536-500846c6e53a/tier-beginner.jpg";

const tierPro = "/__l5e/assets-v1/b081a13c-b17d-495f-addf-bf83f9f20930/tier-pro.jpg";
const tierPremium = "/__l5e/assets-v1/aed9ef52-2740-4a48-83db-2b807a45e958/tier-premium.jpg";
const tierElite = "/__l5e/assets-v1/74dd6c4b-6aa9-466c-89ab-b1e0b75b28ac/tier-elite.jpg";

const tradingViewLogo =
  "https://s3.tradingview.com/userpics/6171439-mFQX_big.png";
const mt5Logo = mt5LogoAsset;

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

export const LINKS = {
  freeChannel: "https://t.me/ezymap",
  support: "https://t.me/ezysarah",
  bot: "https://t.me/ezyregisterbot",
  macro: "https://t.me/xaubtcmacro_bot",
  ebook: "https://t.me/m/r7Oig5BLMTk9",
  vantage: "https://www.vantagemarketsea.com/ms/open-live-account/?affid=MjY0NjgwMDg%3D&invitecode=oQQlQ8yM",
  tradingView: "https://www.tradingview.com/pricing/?share_your_love=printezyusd",
};


/**
 * Bot links carry `?start=<sessionId>` so the Telegram bot can look the
 * visitor's fbclid back up. sessionId only exists client-side, so render the
 * plain href on first paint and swap it in after mount (no hydration mismatch).
 */
function useBotLink() {
  const [href, setHref] = useState(LINKS.bot);
  useEffect(() => {
    setHref(`${LINKS.bot}?start=${encodeURIComponent(getSessionId())}`);
  }, []);
  return href;
}

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

/* Apple-style easing: slow, buttery, settles gently */
const APPLE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Reveal({
  children,
  delay = 0,
  y = 32,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: APPLE_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        {eyebrow ? (
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-primary">{eyebrow}</p>
        ) : null}
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {subtitle ? <p className="mt-4 text-base text-body">{subtitle}</p> : null}
      </div>
    </Reveal>
  );
}

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
    <Button
      asChild
      variant={variant === "primary" ? "primary" : "outline"}
      className={className}
    >
      <a href={href} onClick={() => goTrack(event)}>
        <Send className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}

function SupportCta({ className = "" }: { className?: string }) {
  return (
    <Button asChild variant="outline" size="sm" className={className}>
      <a href={LINKS.support} onClick={() => goTrack("support_click")}>
        <Send className="h-4 w-4" /> Ask Sarah
      </a>
    </Button>
  );
}

function NeonFreeAccessButton({
  href,
  event,
}: {
  href: string;
  event: string;
}) {
  return (
    <a href={href} onClick={() => goTrack(event)} className="neon-free-btn">
      <span className="neon-free-btn-inner">Get Free Access</span>
    </a>
  );
}

function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src={brandLogo}
        alt="EzyMap Algo logo"
        className="h-8 w-8 rounded-md object-contain"
      />
      <span className="font-display text-[17px] font-extrabold tracking-tight text-foreground">
        EzyMap<span className="text-accent">Algo</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Market ticker (static reference quotes)                             */
/* ------------------------------------------------------------------ */

const TICKER: { symbol: string; price: string; change: string; up: boolean }[] = [
  { symbol: "XAU/USD", price: "4,598.70", change: "+0.42%", up: true },
  { symbol: "XAG/USD", price: "32.15", change: "+0.55%", up: true },
  { symbol: "EUR/USD", price: "1.0912", change: "-0.18%", up: false },
  { symbol: "GBP/USD", price: "1.2985", change: "+0.31%", up: true },
  { symbol: "USD/JPY", price: "152.36", change: "+0.21%", up: true },
  { symbol: "AUD/USD", price: "0.6745", change: "-0.12%", up: false },
  { symbol: "USD/CAD", price: "1.3560", change: "+0.08%", up: true },
  { symbol: "BTC/USD", price: "94,240", change: "+1.86%", up: true },
  { symbol: "ETH/USD", price: "3,512.80", change: "+2.14%", up: true },
  { symbol: "SOL/USD", price: "142.35", change: "+3.42%", up: true },
  { symbol: "US30", price: "43,118", change: "-0.24%", up: false },
  { symbol: "US500", price: "5,980.25", change: "-0.11%", up: false },
  { symbol: "NAS100", price: "21,245", change: "+0.38%", up: true },
  { symbol: "USOIL", price: "71.84", change: "-0.63%", up: false },
  { symbol: "UKOIL", price: "75.20", change: "-0.45%", up: false },
];

export function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="w-full border-b border-border bg-surface-elevated text-foreground">
      <div className="ticker-wrap mx-auto max-w-6xl px-4 py-1.5 text-[12.5px] sm:px-6 lg:px-8">
        <div className="ticker-track animate-ticker gap-8">
          {items.map((t, i) => (
            <span key={`${t.symbol}-${i}`} className="flex shrink-0 items-baseline gap-1.5">
              <span className="font-semibold text-body">{t.symbol}</span>
              <span className="font-mono tabular-nums text-foreground">{t.price}</span>
              <span
                className="font-mono tabular-nums font-semibold"
                style={{ color: t.up ? "var(--market-up)" : "var(--market-down)" }}
              >
                {t.change}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { label: "Signals", href: "/#features" },
  { label: "Packages", href: "/#packages" },
  { label: "Tools", href: "/#tools" },
  { label: "Macro", href: "/macro" },
];

/** Not in the header nav — footer-only wayfinding links. */
const FOOTER_ONLY_ITEMS = [
  { label: "Track Record", href: "/#track-record" },
  { label: "FAQ", href: "/faq" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    toggleBtnRef.current?.focus();
  }, []);

  // Body scroll lock, focus trap, Escape-to-close and click-outside-to-dismiss
  // while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !menuRef.current) return;
      const focusable = menuRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && !toggleBtnRef.current?.contains(target)) {
        closeMenu();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, closeMenu]);

  return (
    <>
      <Ticker />
      <header className="sticky top-0 z-50 bg-background">
        <nav className="border-b border-border">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" aria-label="EzyMap Algo home">
              <Logo />
            </Link>

            <ul className="hidden items-center gap-6 md:flex">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="flex min-h-11 items-center text-sm font-medium text-body transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden items-center gap-4 md:flex">
              <Button asChild variant="outline" size="sm">
                <a href={LINKS.support} onClick={() => goTrack("nav_ask_sarah")}>
                  <Send className="h-4 w-4" /> Ask Sarah
                </a>
              </Button>
            </div>

            <button
              ref={toggleBtnRef}
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground md:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {open ? (
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="border-b border-border bg-background md:hidden"
          >
            <ul className="space-y-1 px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={closeMenu}
                    className="flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-body hover:bg-surface"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <Button asChild variant="outline" size="md" className="w-full">
                  <a href={LINKS.support} onClick={() => goTrack("nav_ask_sarah_mobile")}>
                    <Send className="h-4 w-4" /> Ask Sarah
                  </a>
                </Button>
              </li>
            </ul>
          </div>
        ) : null}
      </header>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function ChartGraphic() {
  const bars = [38, 52, 44, 66, 58, 78, 70, 92, 84, 108, 100, 124];
  return (
    <svg viewBox="0 0 420 180" className="h-full w-full" role="img" aria-label="Uptrend candlestick chart">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[36, 72, 108, 144].map((y) => (
        <line key={y} x1="0" y1={y} x2="420" y2={y} stroke="var(--border)" strokeWidth="1" />
      ))}
      <path
        d={`M0,150 ${bars.map((b, i) => `L${i * 36 + 12},${170 - b}`).join(" ")} L420,20 L420,180 L0,180 Z`}
        fill="url(#areaFill)"
      />
      <path
        d={`M0,150 ${bars.map((b, i) => `L${i * 36 + 12},${170 - b}`).join(" ")} L420,20`}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {bars.map((b, i) => {
        const x = i * 36 + 12;
        const up = i % 3 !== 1;
        const color = up ? "var(--primary)" : "var(--accent)";
        return (
          <g key={i}>
            <line x1={x} y1={170 - b - 14} x2={x} y2={170 - b + 14} stroke={color} strokeWidth="1.5" opacity="0.7" />
            <rect x={x - 5} y={170 - b - 8} width="10" height="16" rx="2" fill={color} opacity="0.85" />
          </g>
        );
      })}
    </svg>
  );
}

function Hero() {
  const { formatted: memberCount } = useMemberCount();
  return (
    <section className="bg-hero border-b border-border">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 text-[12.5px] font-bold uppercase tracking-wide text-primary">
            <span className="font-mono tabular-nums">{memberCount}</span> Active Members · Est. 2021
          </span>
          <h1 className="mt-4 max-w-2xl text-[34px] leading-[1.05] text-foreground sm:text-[44px]">
            Professional trading signals, delivered live to your phone.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-body">
            Forex, commodities and crypto analysis from a 10-year veteran trader, delivered on
            Telegram with full entry, stop and target transparency.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/free-channel"
              onClick={() => goTrack("hero_join_free")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
            >
              <Send className="h-4 w-4" /> Join Free Channel
            </Link>
            <a
              href="/#packages"
              onClick={() => goTrack("hero_see_packages")}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              See packages
            </a>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            <Link
              to="/ebooks/$slug"
              params={{ slug: "technical-analysis" }}
              onClick={() => goTrack("hero_free_ebook")}
              className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" /> Get the free ebook
            </Link>
          </p>

          <dl className="mt-9 grid max-w-lg grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
            {[
              [memberCount, "Active members"],
              ["24/5", "Market coverage"],
              ["3 Styles", "Scalp · Intraday · Swing"],
            ].map(([v, l]) => (
              <div key={l} className="bg-card px-4 py-3.5">
                <dt className="font-mono text-xl font-extrabold tabular-nums text-foreground">{v}</dt>
                <dd className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {l}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <div className="rounded-md border border-border bg-card shadow-elevated">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <span className="text-sm font-bold text-foreground">XAU/USD · Gold Spot</span>
              <span className="rounded bg-accent-tint px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-accent">
                Sample signal
              </span>
            </div>
            <div className="h-40 px-2 py-3 sm:h-48">
              <ChartGraphic />
            </div>
            <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
              {[
                ["Entry", "4,598.70", "text-foreground"],
                ["Stop", "4,596.70", "text-accent"],
                ["Target", "4,600.61", "text-primary"],
              ].map(([label, value, tone]) => (
                <div key={label} className="bg-secondary px-3 py-3 text-center">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className={`mt-1 font-mono text-sm font-extrabold tabular-nums ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Illustrative example of signal format. Trading carries risk of loss. Signals are for
            education only and are not personalized financial advice.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip                                                         */
/* ------------------------------------------------------------------ */

const PLATFORMS = ["Telegram", "TradingView", "Vantage Markets", "ForexFactory"];

export function TrustStrip() {
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Trusted platforms we operate on
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
/* Track record                                                        */
/* ------------------------------------------------------------------ */

export function TrackRecord() {
  return (
    <Section id="track-record" className="bg-surface">
      <SectionHeading
        eyebrow="Track record"
        title="Check the history yourself"
        subtitle="We publish every call in the channel with timestamps. Verify our history before you pay for anything."
      />
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
        <a
          href={LINKS.freeChannel}
          onClick={() => goTrack("track_record_telegram")}
          className="flex h-full flex-col rounded-md border border-border bg-card p-5 transition-colors hover:border-primary"
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary">Telegram history</p>
          <h3 className="mt-2 text-lg font-bold">Full signal archive</h3>
          <p className="mt-2 flex-1 text-sm text-body">
            Scroll back through every published signal, entry, stop and target in the free channel.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Open channel <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </a>
        <a
          href="https://www.forexfactory.com/calendar"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => goTrack("track_record_forexfactory")}
          className="flex h-full flex-col rounded-md border border-border bg-card p-5 transition-colors hover:border-accent"
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent">Reference</p>
          <h3 className="mt-2 text-lg font-bold">ForexFactory calendar</h3>
          <p className="mt-2 flex-1 text-sm text-body">
            Cross-check every event we trade against the public economic calendar. This is a data
            reference, not a performance record.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            Open ForexFactory <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </a>
      </div>
      <p className="mx-auto mt-5 max-w-4xl text-xs leading-relaxed text-muted-foreground">
        Past performance is not indicative of future results. We do not publish win-rate or pip
        totals that cannot be independently verified.
      </p>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { icon: Zap, title: "Real-time Signals", body: () => "Instant alerts the moment a setup forms on our indicators." },
  { icon: GraduationCap, title: "Live Education", body: () => "Learn proven, mechanical trading strategies from Jack." },
  { icon: Users, title: "Community", body: (memberCount: string) => `Connect with ${memberCount} traders worldwide inside Telegram.` },
  { icon: Smartphone, title: "Mobile First", body: () => "Get alerts anywhere, anytime — no terminal required." },
];

export function Features() {
  const { formatted: memberCount } = useMemberCount();
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="What you get"
        title="Built for traders who want clarity"
        subtitle="Everything runs through Telegram, so you never miss a setup while you're away from the charts."
      />
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.04} className="h-full">
          <article className="glass-card h-full rounded-xl p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-body">
              {f.body(memberCount)}
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
  blurb: string;
  features: (memberCount: string) => string[];
  cta: string;
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
    blurb: "Start with essential signals",
    features: (memberCount) => [
      `Join our ${memberCount} trader community`,
      "Daily signals & education",
      "Public channel access",
      "Enroll through our bot",
    ],
    cta: "Enroll Now",
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
    blurb: "Scalp Mastery Signals",
    features: () => ["M5 Timeframe Strategies", "Real-time Alerts", "Enroll through our bot"],
    cta: "Enroll Now",
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
    blurb: "Alpha Edge Signals",
    features: () => [
      "M15-M30 Intraday",
      "Advanced Analysis",
      "Priority Support",
      "Enroll through our bot",
    ],
    cta: "Enroll Now",
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
    blurb: "Full Suite",
    features: () => [
      "All indicators included",
      "1-on-1 Coaching with Jack",
      "Custom Strategies",
      "Premium Support",
      "Enroll through our bot",
    ],
    cta: "Enroll Now",
    href: LINKS.bot,
    sku: "signal_elite",
    event: "pricing_elite",
    image: tierElite,
    freeAlt: true,
  },
];

export function Pricing() {
  const botHref = useBotLink();
  const { formatted: memberCount } = useMemberCount();
  return (
    <Section id="packages" className="bg-surface/40">
      <SectionHeading
        eyebrow="Packages"
        title="Start with clarity. Upgrade when you're ready."
        subtitle="All tiers enroll through our bot. Want free access? Activate through Vantage Markets — no card required."
      />
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.04} className="h-full">
          <article
            id={t.sku}
            className={`relative flex h-full scroll-mt-24 flex-col overflow-hidden rounded-xl ${
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
                    Most popular
                  </span>
                ) : null}
                <img
                  src={t.image}
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
                    Most popular
                  </span>
                ) : null}
              </div>
            )}
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t.name}
              </h3>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-extrabold tracking-tight tabular-nums text-foreground">
                  {t.price}
                </span>
                {t.priceNote ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.priceNote}
                  </span>
                ) : null}
              </p>
              {t.freeAlt ? (
                <p className="mt-1 text-[11px] font-medium leading-snug text-accent">
                  or free access by Vantage activation
                </p>
              ) : (
                <p className="mt-1 h-4" aria-hidden="true" />
              )}
              <p className="mt-2 text-sm font-semibold text-body">{t.blurb}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {t.features(memberCount).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-body">{f}</span>
                  </li>
                ))}
              </ul>
              {t.openAccountHref ? (
                <a
                  href={t.openAccountHref}
                  onClick={() => goTrack(t.openAccountEvent!)}
                  className="neon-free-btn neon-pearl mt-6"
                >
                  <span className="neon-free-btn-inner">Open Account</span>
                </a>
              ) : null}

              <div className={t.openAccountHref ? "mt-2" : "mt-6"} onClickCapture={() => goTrack(t.event)}>
                <BuyButton sku={t.sku} label={t.cta} />
              </div>
              <p className="mt-1.5 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" /> Secured by Stripe
              </p>
              {t.freeAlt ? (
                t.name === "Premium" ? (
                  <div className="mt-2">
                    <NeonFreeAccessButton
                      href={botHref}
                      event={`${t.event}_free_access`}
                    />
                  </div>
                ) : (
                  <Button asChild variant="outline" className="mt-2 w-full">
                    <a href={botHref} onClick={() => goTrack(`${t.event}_free_access`)}>
                      Get Free Access
                    </a>
                  </Button>
                )
              ) : null}
            </div>
          </article>
          </Reveal>
        ))}
      </div>
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
        <a href={LINKS.support} onClick={() => goTrack("pricing_support")} className="text-primary hover:underline">
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

export const EBOOKS = [
  {
    title: "Mapping Like A Pro",
    slug: "mapping-like-a-pro",
    image: ebookMapping,
    bullets: ["Master support & resistance zones", "Spot high-probability setups", "Step-by-step PDF guide"],
  },
  {
    title: "Technical Analysis Ebook",
    slug: "technical-analysis",
    image: ebookTechnical,
    bullets: ["Price action fundamentals", "Indicator confluence framework", "Risk management rules"],
  },
];

const TV_FEATURES = [
  "Real-time signal generation",
  "Support/Resistance detection",
  "Confluence analysis",
];

const MT5_FEATURES = [
  "Built for Vantage Markets",
  "Automated signals",
  "Risk management tools",
  "Available in Elite tier",
];

function Book3D({ image, title }: { image: string; title: string }) {
  return (
    <div className="book-3d aspect-[2/3] w-28 shrink-0 sm:w-32">
      <div className="book-back" aria-hidden="true" />
      <img
        src={image}
        alt={`${title} cover`}
        loading="lazy"
        className="book-cover"
      />
    </div>
  );
}

export function Products() {
  const botHref = useBotLink();
  return (
    <Section id="products">
      <SectionHeading
        eyebrow="Products"
        title="The full EzyMap toolkit"
        subtitle="Ebooks, indicators and macro research — everything behind the signals."
      />

      {/* Ebooks */}
      <div className="mb-14">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <h3 className="text-xl font-bold">Ebooks</h3>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {EBOOKS.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.04}>
              <Link
                to="/ebooks/$slug"
                params={{ slug: b.slug }}
                onClick={() => goTrack(`ebook_${b.title.toLowerCase().replace(/\s+/g, "_")}`)}
                className="glass-card group flex h-full items-stretch gap-4 overflow-hidden rounded-xl p-4 transition-transform hover:-translate-y-1 sm:gap-5 sm:p-5"
              >
                <Book3D image={b.image} title={b.title} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <h4 className="text-base font-semibold leading-snug sm:text-lg">{b.title}</h4>
                  <ul className="mt-2 flex-1 space-y-1">
                    {b.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-xs text-body sm:text-sm">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="mt-4 inline-flex items-center gap-1 rounded-md border border-accent/60 bg-accent/5 px-3 py-2 text-xs font-semibold text-accent transition-colors group-hover:bg-accent/10 sm:px-4 sm:text-sm">
                    Get it free <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* TradingView indicators */}
        <Reveal className="h-full">
        <article className="glass-card flex h-full flex-col rounded-xl p-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#0a0c0b] p-1.5">
            <img src={tradingViewLogo} alt="TradingView logo" loading="lazy" className="h-full w-full object-contain" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">TradingView Indicators</h3>
          <ul className="mt-4 flex-1 space-y-2.5">
            {TV_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-body">{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-2 pt-5">
            <a
              href={botHref}
              onClick={() => goTrack("products_tv_enroll")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Enroll Now <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <Button asChild variant="outline">
              <a
                href={LINKS.tradingView}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("products_tv_open_free_account")}
              >
                <img src={tradingViewLogo} alt="" className="h-4 w-4 object-contain" />
                Open Free Account
              </a>
            </Button>
          </div>
        </article>
        </Reveal>

        {/* MT5 indicators */}
        <Reveal className="h-full" delay={0.1}>
        <article className="glass-card flex h-full flex-col rounded-xl p-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#f4f1ea] p-1.5">
            <img src={mt5Logo} alt="MetaTrader 5 logo" loading="lazy" className="h-full w-full object-contain" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">MT5 Indicators</h3>
          <ul className="mt-4 flex-1 space-y-2.5">
            {MT5_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-body">{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-2 pt-5">
            <a
              href={botHref}
              onClick={() => goTrack("products_mt5_enroll")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Enroll Now <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <Button asChild variant="outline">
              <a
                href="https://www.metatrader5.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("products_mt5_download")}
              >
                Download MT5 Now <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </article>
        </Reveal>

        {/* Macro & Fundamentals */}
        <Reveal className="h-full" delay={0.2}>
        <article className="glass-card relative flex h-full flex-col overflow-hidden rounded-xl p-6">
          <img
            src={macroLogo}
            alt="Gold, Forex & Crypto Macros"
            loading="lazy"
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full object-contain opacity-15"
          />
          <img
            src={macroLogo}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-12 w-12 rounded-full object-contain ring-1 ring-accent/30"
          />
          <h3 className="mt-4 text-lg font-semibold">Macro &amp; Fundamentals</h3>
          <ul className="mt-4 flex-1 space-y-2.5">
            {["Daily macro updates", "Economic analysis", "Gold & crypto coverage"].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="text-body">{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-2 pt-5">
            <a
              href={LINKS.macro}
              onClick={() => goTrack("products_macro_join")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Join Macro Bot <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <Button asChild variant="outline">
              <Link to="/macro" onClick={() => goTrack("products_macro_view")}>
                View It Here <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
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

const STEPS = [
  { title: "Join t.me/ezymap", body: "One tap. No payment, no forms — you're in the free channel instantly." },
  { title: "Receive instant signal alerts", body: "Entry, stop loss and targets arrive as soon as a setup confirms." },
  { title: "Execute on Vantage Markets", body: "Place the trade with your own broker — we recommend Vantage Markets." },
];

export function HowItWorks() {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <Section id="how-it-works" className="bg-surface/40">
      <SectionHeading eyebrow="How it works" title="Three steps to your first signal" />
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            className="glass-card relative flex h-full flex-col rounded-xl p-6"
            initial={reducedMotion ? false : { opacity: 0, y: 32, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: i * 0.04, ease: APPLE_EASE }}
          >
            <span className="font-display text-4xl font-bold text-accent/40">0{i + 1}</span>
            <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 flex-1 text-sm text-body">{s.body}</p>
          </motion.li>
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

export function Ambassador() {
  const { formatted: memberCount } = useMemberCount();
  return (
    <Section id="ambassador">
      <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
        <div className="glass-card relative overflow-hidden rounded-xl p-8 text-center">
          <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full border-2 border-accent/40 shadow-gold">
            <img
              src={jackPhoto}
              alt="Jack, founder of EzyMap ALGO"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-5 text-lg font-semibold">Jack</p>
          <p className="text-sm text-muted-foreground">Founder, EzyMap ALGO</p>
          <p className="mt-3 text-xs text-muted-foreground">
            10+ year trading veteran
          </p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <a href={LINKS.support} onClick={() => goTrack("ambassador_contact_sarah")}>
              <Send className="h-4 w-4" /> Questions? Ask Sarah
            </a>
          </Button>
        </div>
        </Reveal>

        <Reveal delay={0.15}>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-primary">Ambassador</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Meet Jack</h2>
          <p className="mt-4 text-base text-body">
            Jack focuses on one thing: repeatable, mechanical execution.
          </p>
          <blockquote className="mt-6 border-l-2 border-accent pl-4 text-lg italic text-foreground">
            "Consistent wins come from consistent methodology."
          </blockquote>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              [memberCount, "Students"],
              ["10+ yrs", "Trading"],
              ["24/5", "Coverage"],
            ].map(([v, l]) => (
              <div key={l} className="flex h-full flex-col rounded-xl border border-border bg-surface p-4">
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
  role: string;
  quote: string;
  /** Real Telegram handle, only set for testimonials that can genuinely be verified. */
  verifiedHandle?: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Budi D.",
    role: "Part-time trader",
    quote: "The alerts land on my phone while I'm at work. I no longer stare at charts all day.",
  },
  {
    name: "Priya R.",
    role: "Intraday trader",
    quote: "Clean entries, clear invalidation. It made my journaling and risk sizing far easier.",
  },
  {
    name: "Luqman R.",
    role: "Scalper",
    quote: "The M5 channel matches how I already trade — it just removes the second-guessing.",
  },
  {
    name: "Chen W.",
    role: "New trader",
    quote: "Started on the free channel to learn. The education alone was worth joining.",
  },
];

export function SocialProof() {
  const { formatted: memberCount } = useMemberCount();
  return (
    <Section id="testimonials" className="bg-surface/40">
      <SectionHeading
        eyebrow="Social proof"
        title={`${memberCount} active traders trust EzyMap`}
        subtitle="Real feedback from the community inside our Telegram channels."
      />
      <div className="mb-10 grid gap-4">
        {[
          [Clock, "24/5", "Market coverage"],
        ].map(([Icon, v, l], i) => {
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
      </div>
      <div className="flex flex-wrap justify-center gap-5">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.04} className="h-full w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)] lg:max-w-xs">
          <figure className="glass-card flex h-full flex-col rounded-xl p-6">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <blockquote className="mt-3 flex-1 text-sm text-body">"{t.quote}"</blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-semibold">{t.name}</span>
              <span className="block text-xs text-muted-foreground">{t.role}</span>
              {t.verifiedHandle ? (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                  <ShieldCheck className="h-3 w-3" /> Verified Telegram member
                </span>
              ) : null}
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

const FAQ_GROUPS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Routines & signals",
    items: [
      {
        q: "How often do you send signals?",
        a: "Multiple times daily during trading hours (24/5). Frequency depends on market conditions — we only alert when a setup meets our criteria. Quality over quantity.",
      },
      {
        q: "What markets do you trade?",
        a: "Forex (major pairs), crypto and commodities. Our primary focus is scalping and intraday trading, with swing setups on higher timeframes.",
      },
      {
        q: "What trading styles do the routines cover?",
        a: "Three styles: Scalp, Intraday and Swing. Every signal states its style, entry, stop-loss and take-profit so you can match it to your schedule.",
      },
      {
        q: "Do I need trading experience?",
        a: "No. Our education channel teaches everything step by step. Start on the free channel and learn as you go.",
      },
      {
        q: "Which broker should I use?",
        a: "We recommend Vantage Markets (our affiliate partner), but any broker you trust will work with our routines.",
      },
    ],
  },
  {
    title: "Pricing tiers",
    items: [
      {
        q: "Is there a free option?",
        a: "Join our free Telegram channel for sample signals and education. You can also unlock any paid tier free by activating a Vantage Markets account — no card required. The Beginner tier at $29/month is the paid entry point.",
      },
      {
        q: "What's included in Pro, Premium and Elite?",
        a: "Pro ($49) adds the full signal feed and indicators. Premium ($99) adds the macro & fundamentals desk and priority support. Elite ($299) adds Jack's personal routines, 1-on-1 onboarding and everything else.",
      },
      {
        q: "Can I upgrade or downgrade later?",
        a: "Yes. Open the enrollment bot, choose your new package, and your account updates once payment is confirmed. Your trade log and history carry over.",
      },
      {
        q: "Do you offer refunds?",
        a: "Message Sarah through the bot with your Telegram username and order details — she handles refund requests case by case.",
      },
    ],
  },
  {
    title: "Enrollment & your account",
    items: [
      {
        q: "How do I enroll in a paid tier?",
        a: "Tap Enroll Now on any package to open our enrollment bot on Telegram, pick your tier, and pay securely by card through Stripe. Your access activates the moment payment is confirmed.",
      },
      {
        q: "How do I access my account?",
        a: "Type /account in the bot for a one-tap signed-in link, or sign in on the site with a 6-digit code the bot sends to your Telegram — no passwords.",
      },
      {
        q: "What happens after I pay?",
        a: "The bot confirms your payment instantly and your dashboard unlocks: the tier-gated signal feed, your personal trade log, performance stats and billing history.",
      },
      {
        q: "Who do I contact for help?",
        a: "Use the 💬 Ask Sarah button in the bot (or /ask) for live chat with our support lead, or reach her directly at t.me/ezysarah.",
      },
    ],
  },
];

export function Faq() {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  return (
    <Section id="faq">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <div className="mx-auto max-w-3xl space-y-10">
        {FAQ_GROUPS.map((g, gi) => (
          <div key={g.title}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {g.title}
            </h3>
            <div className="space-y-3">
              {g.items.map((f, i) => {
                const id = `${gi}-${i}`;
                return (
                  <Reveal key={f.q} delay={i * 0.04} y={20}>
                  <div className="glass-card overflow-hidden rounded-xl">
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-expanded={openIds.includes(id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold">{f.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openIds.includes(id) ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openIds.includes(id) ? (
                      <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-body">
                        {f.a}
                      </p>
                    ) : null}
                  </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCta() {
  const botHref = useBotLink();
  return (
    <Section id="get-started" className="bg-surface/40">
      <Reveal>
      <div className="glass-card rounded-xl px-6 py-14 text-center sm:px-12">
        <h2 className="text-3xl sm:text-4xl">Start with the free channel today</h2>
        <p className="mx-auto mt-4 max-w-xl text-body">
          No payment, no commitment. See the signals and education for yourself, then upgrade
          through our bot when it fits your trading.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <TelegramCta event="final_join_free" className="px-7 py-3.5 text-base" />
          <TelegramCta
            label="Enroll via Bot"
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

export function Footer() {
  const botHref = useBotLink();
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Professional trading signals and education delivered on Telegram. Built for traders
              who value consistency over hype.
            </p>
            <a
              href={LINKS.freeChannel}
              onClick={() => goTrack("footer_telegram")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-glow"
            >
              <Send className="h-4 w-4" /> t.me/ezymap
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Navigate</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[...NAV_ITEMS, ...FOOTER_ONLY_ITEMS].map((i) => (
                <li key={i.href}>
                  <a href={i.href} className="hover:text-foreground">
                    {i.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Links</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={botHref} onClick={() => goTrack("footer_bot")} className="hover:text-foreground">
                  Enrollment Bot
                </a>
              </li>
              <li>
                <a href={LINKS.support} onClick={() => goTrack("footer_support")} className="hover:text-foreground">
                  Support (Sarah)
                </a>
              </li>
              <li>
                <a href={LINKS.macro} onClick={() => goTrack("footer_macro")} className="hover:text-foreground">
                  Macro &amp; Fundamentals
                </a>
              </li>
              <li>
                <a href={LINKS.vantage} onClick={() => goTrack("footer_vantage")} className="hover:text-foreground">
                  Vantage Markets
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href={LINKS.support} onClick={() => goTrack("footer_contact")} className="hover:text-foreground">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 EzyMap ALGO. All rights reserved.</p>
          <p>Trading involves risk. Signals are educational, not financial advice.</p>
        </div>
      </div>
    </footer>
  );
}

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
    trackAdClick();
    // The site's own page view, reported to Meta through the same pipeline
    // as the bot events (consent-gated where required).
    metaTrack("PageView", { id: "landing" });
    const stopEngage = trackEngagement();
    const stopSections = trackSectionVisibility([
      "features",
      "packages",
      "products",
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
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main>
          <Hero />
          <TrustStrip />
          <Features />
          <Pricing />
          <Tools />
          <Products />
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
