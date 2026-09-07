import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import mt5LogoAsset from "@/assets/mt5-logo.png";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getActiveMemberCount } from "@/lib/member-count.functions";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { useTranslation, useLocale, localizePath, LOCALES, LOCALE_LABELS, LOCALE_FLAGS, LOCALE_NATIVE_NAMES } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import { useCountUp } from "@/lib/use-count-up";
import { BuyButton } from "@/components/BuyButton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { Tools } from "@/components/landing/Tools";

const EbookDetailsModal = lazy(() =>
  import("@/components/EbookDetailsModal").then((m) => ({ default: m.EbookDetailsModal })),
);
import {
  LogIn,
  UserRound,
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
  Bot,
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
  ezyai: "https://t.me/ezytradeai_bot",
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
    <div className="flex justify-center">
      <a href={href} onClick={() => goTrack(event)} className="neon-free-btn neon-free-btn--compact">
        <span className="neon-free-btn-inner">Get Free Access</span>
      </a>
    </div>
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
      <span className="font-display text-[17px] font-bold tracking-tight text-foreground">
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
  { key: "nav_signals", href: "/#features" },
  { key: "nav_packages", href: "/#packages" },
  { key: "nav_tools", href: "/#tools" },
  { key: "nav_macro", href: "/macro" },
  { key: "nav_ezyai", href: "/ezyai" },
] as const;

/** Not in the header nav — footer-only wayfinding links. */
const FOOTER_ONLY_ITEMS = [
  { key: "footer_track_record", href: "/#track-record" },
  { key: "footer_faq", href: "/faq" },
] as const;

function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-body transition-colors hover:bg-surface"
      >
        <span aria-hidden="true">{LOCALE_FLAGS[locale]}</span>
        {LOCALE_LABELS[locale]}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-elevated"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={locale === l}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  locale === l ? "bg-primary-tint text-primary" : "text-body hover:bg-surface"
                }`}
              >
                <span aria-hidden="true">{LOCALE_FLAGS[l]}</span>
                <span className="flex-1">{LOCALE_NATIVE_NAMES[l]}</span>
                {locale === l ? <Check className="h-3.5 w-3.5" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * "Sign in" for visitors, "My account" once a Supabase session exists.
 * Client-only: renders an empty placeholder until the session is known so
 * SSR and the first client paint agree.
 */
function AuthMenu({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const [state, setState] = useState<"unknown" | "out" | "in">("unknown");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState(data.session ? "in" : "out");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState(session ? "in" : "out");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (state === "unknown") {
    return <span aria-hidden="true" className={mobile ? "block h-11" : "inline-block h-8 w-16"} />;
  }
  const redirect = typeof window !== "undefined" ? window.location.pathname : "/";
  return (
    <Button asChild variant="ghost" size={mobile ? "md" : "sm"} className={mobile ? "w-full justify-start" : ""}>
      {state === "in" ? (
        <Link to="/dashboard" onClick={onNavigate}>
          <UserRound className="h-4 w-4" /> {t("nav_my_account")}
        </Link>
      ) : (
        <Link to="/auth" search={{ redirect }} onClick={onNavigate}>
          <LogIn className="h-4 w-4" /> {t("nav_sign_in")}
        </Link>
      )}
    </Button>
  );
}

export function Nav() {
  const { t, locale } = useTranslation();
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
            <Link to={locale === "ms" ? "/ms" : "/"} aria-label="EzyMap Algo home">
              <Logo />
            </Link>

            <ul className="hidden items-center gap-6 lg:flex">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={localizePath(item.href, locale)}
                    className="flex min-h-11 items-center text-sm font-medium text-body transition-colors hover:text-primary"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden items-center gap-4 lg:flex">
              <LocaleSwitcher />
              <AuthMenu />
              <Button asChild variant="outline" size="sm">
                <a href={LINKS.support} onClick={() => goTrack("nav_ask_sarah")}>
                  <Send className="h-4 w-4" /> {t("nav_ask_sarah")}
                </a>
              </Button>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <LocaleSwitcher />
              <button
                ref={toggleBtnRef}
                type="button"
                aria-label={t("nav_toggle_menu")}
                aria-expanded={open}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </nav>

        {open ? (
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav_site_menu")}
            className="border-b border-border bg-background lg:hidden"
          >
            <ul className="space-y-1 px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={localizePath(item.href, locale)}
                    onClick={closeMenu}
                    className="flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-body hover:bg-surface"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <AuthMenu mobile onNavigate={closeMenu} />
              </li>
              <li className="pt-2">
                <Button asChild variant="outline" size="md" className="w-full">
                  <a href={LINKS.support} onClick={() => goTrack("nav_ask_sarah_mobile")}>
                    <Send className="h-4 w-4" /> {t("nav_ask_sarah")}
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
  const { t } = useTranslation();
  return (
    <section className="bg-hero relative overflow-hidden border-b border-border">
      {/* Blurred colour orbs behind the hero — pure decoration. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="glow-orb animate-float-slow motion-reduce:animate-none left-[-8%] top-[-12%] h-[420px] w-[420px] bg-primary/25" />
        <div className="glow-orb animate-float-slower motion-reduce:animate-none right-[-6%] top-[8%] h-[380px] w-[380px] bg-accent/20" />
        <div className="glow-orb bottom-[-30%] left-[38%] h-[360px] w-[360px] bg-primary/15" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-16">
        <div>
          <span className="hero-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-body">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono font-extrabold tabular-nums text-primary">{memberCount}</span>{" "}
            {t("hero_badge")}
          </span>
          <h1 className="mt-4 max-w-2xl text-[34px] leading-[1.05] text-foreground sm:text-[44px]">
            {t("hero_title")}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-body">
            {t("hero_subtitle")}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/free-channel"
              onClick={() => goTrack("hero_join_free")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
            >
              <Send className="h-4 w-4" /> {t("hero_cta_join")}
            </Link>
            <a
              href="/#packages"
              onClick={() => goTrack("hero_see_packages")}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              {t("hero_cta_packages")}
            </a>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            <Link
              to="/ebooks/$slug"
              params={{ slug: "technical-analysis" }}
              onClick={() => goTrack("hero_free_ebook")}
              className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" /> {t("hero_cta_ebook")}
            </Link>
          </p>

          <dl className="mt-9 grid max-w-lg grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
            {[
              [memberCount, t("hero_stat_members")],
              ["24/5", t("hero_stat_coverage")],
              ["3 Styles", t("hero_stat_styles")],
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
              <span className="text-sm font-bold text-foreground">{t("hero_sample_symbol")}</span>
              <span className="rounded bg-accent-tint px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-accent">
                {t("hero_sample_badge")}
              </span>
            </div>
            <div className="h-40 px-2 py-3 sm:h-48">
              <ChartGraphic />
            </div>
            <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
              {[
                [t("hero_sample_entry"), "4,598.70", "text-foreground"],
                [t("hero_sample_stop"), "4,596.70", "text-accent"],
                [t("hero_sample_target"), "4,600.61", "text-primary"],
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
            {t("hero_disclaimer")}
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

export function StatsStrip() {
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
            <span className="font-mono text-3xl font-extrabold tabular-nums text-foreground">{value}</span>
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

export function Showcase() {
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
                      src={row.image}
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

export function CtaBand() {
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
              href={localizePath("/ezyai", locale)}
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

export function TrackRecord() {
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
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary">{t("track_record_telegram_eyebrow")}</p>
          <h3 className="mt-2 text-lg font-bold">{t("track_record_telegram_title")}</h3>
          <p className="mt-2 flex-1 text-sm text-body">
            {t("track_record_telegram_body")}
          </p>
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
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent">{t("track_record_ff_eyebrow")}</p>
          <h3 className="mt-2 text-lg font-bold">{t("track_record_ff_title")}</h3>
          <p className="mt-2 flex-1 text-sm text-body">
            {t("track_record_ff_body")}
          </p>
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

export function Features() {
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
    featureKeys: ["tier_beginner_f1", "tier_beginner_f2", "tier_beginner_f3", "tier_enroll_via_bot"],
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
    featureKeys: ["tier_elite_f1", "tier_elite_f2", "tier_elite_f3", "tier_elite_f4", "tier_enroll_via_bot"],
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
  const { t: tt } = useTranslation();
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
              <p className="mt-2 text-center text-sm font-semibold text-body">{tt(t.blurbKey).replace("{memberCount}", memberCount)}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {t.featureKeys.map((fk) => (
                  <li key={fk} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-body">{tt(fk).replace("{memberCount}", memberCount)}</span>
                  </li>
                ))}
              </ul>
              {t.openAccountHref ? (
                <div className="mt-6 flex justify-center">
                  <a
                    href={t.openAccountHref}
                    onClick={() => goTrack(t.openAccountEvent!)}
                    className="neon-free-btn neon-pearl neon-free-btn--compact"
                  >
                    <span className="neon-free-btn-inner">Open Account</span>
                  </a>
                </div>
              ) : null}

              <div className={t.openAccountHref ? "mt-2" : "mt-6"} onClickCapture={() => goTrack(t.event)}>
                <BuyButton sku={t.sku} label={tt("pricing_cta")} inlineForm />
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
    bulletKeys: ["ebook_mapping_b1", "ebook_mapping_b2", "ebook_mapping_b3"] as TranslationKey[],
  },
  {
    title: "Technical Analysis Ebook",
    slug: "technical-analysis",
    image: ebookTechnical,
    bulletKeys: ["ebook_technical_b1", "ebook_technical_b2", "ebook_technical_b3"] as TranslationKey[],
  },
];

const TV_FEATURE_KEYS: TranslationKey[] = ["tv_feature_1", "tv_feature_2", "tv_feature_3"];

const MT5_FEATURE_KEYS: TranslationKey[] = [
  "mt5_feature_1",
  "mt5_feature_2",
  "mt5_feature_3",
  "mt5_feature_4",
];

const MACRO_FEATURE_KEYS: TranslationKey[] = ["macro_feature_1", "macro_feature_2", "macro_feature_3"];

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
                      <li key={bulletKey} className="flex items-start gap-2 text-xs text-body sm:text-sm">
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

      <AnimatePresence>
        {detailsSlug ? (
          <Suspense fallback={null}>
            <EbookDetailsModal slug={detailsSlug} onClose={() => setDetailsSlug(null)} />
          </Suspense>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* TradingView indicators */}
        <Reveal className="h-full">
        <article className="glass-card flex h-full flex-col rounded-xl p-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-[#0a0c0b] p-1.5">
            <img src={tradingViewLogo} alt="TradingView logo" loading="lazy" className="h-full w-full object-contain" />
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
                <img src={tradingViewLogo} alt="" className="h-4 w-4 object-contain" />
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
            <img src={mt5Logo} alt="MetaTrader 5 logo" loading="lazy" className="h-full w-full object-contain" />
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
        <article className="glass-card flex h-full flex-col rounded-xl p-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Bot className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">{t("products_ezyai_heading")}</h3>
          <ul className="mt-4 flex-1 space-y-2.5">
            {(["ezyai_feature_1", "ezyai_feature_2", "ezyai_feature_3"] as TranslationKey[]).map((fk) => (
              <li key={fk} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-body">{t(fk)}</span>
              </li>
            ))}
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
            <Button asChild variant="outline">
              <Link to="/ezyai" onClick={() => goTrack("products_ezyai_view")}>
                {t("products_view_it_here")} <ArrowRight className="h-3.5 w-3.5" />
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

const STEPS: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: "how_step1_title", bodyKey: "how_step1_body" },
  { titleKey: "how_step2_title", bodyKey: "how_step2_body" },
  { titleKey: "how_step3_title", bodyKey: "how_step3_body" },
];

export function HowItWorks() {
  const reducedMotion = usePrefersReducedMotion();
  const { t } = useTranslation();
  return (
    <Section id="how-it-works" className="bg-surface/40">
      <SectionHeading eyebrow={t("how_eyebrow")} title={t("how_title")} />
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.titleKey}
            className="glass-card card-lift relative flex h-full flex-col rounded-xl p-6"
            initial={reducedMotion ? false : { opacity: 0, y: 32, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: i * 0.04, ease: APPLE_EASE }}
          >
            <span className="font-display text-4xl font-bold text-accent/40">0{i + 1}</span>
            <span className="gradient-tick mt-2" aria-hidden="true" />
            <h3 className="mt-2 text-lg font-semibold">{t(s.titleKey)}</h3>
            <p className="mt-2 flex-1 text-sm text-body">{t(s.bodyKey)}</p>
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
  const { t } = useTranslation();
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
          <p className="text-sm text-muted-foreground">{t("ambassador_role")}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("ambassador_experience")}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <a href={LINKS.support} onClick={() => goTrack("ambassador_contact_sarah")}>
              <Send className="h-4 w-4" /> {t("ambassador_ask_sarah")}
            </a>
          </Button>
        </div>
        </Reveal>

        <Reveal delay={0.15}>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-primary">{t("ambassador_eyebrow")}</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">{t("ambassador_title")}</h2>
          <p className="mt-4 text-base text-body">
            {t("ambassador_bio")}
          </p>
          <blockquote className="mt-6 border-l-2 border-accent pl-4 text-lg italic text-foreground">
            "{t("ambassador_quote")}"
          </blockquote>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              [memberCount, t("ambassador_stat_students")],
              ["10+ yrs", t("ambassador_stat_trading")],
              ["24/5", t("ambassador_stat_coverage")],
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
  roleKey: TranslationKey;
  quoteKey: TranslationKey;
  /** Real Telegram handle, only set for testimonials that can genuinely be verified. */
  verifiedHandle?: string;
};

const TESTIMONIALS: Testimonial[] = [
  { name: "Budi D.", roleKey: "testimonial_budi_role", quoteKey: "testimonial_budi_quote" },
  { name: "Priya R.", roleKey: "testimonial_priya_role", quoteKey: "testimonial_priya_quote" },
  { name: "Luqman R.", roleKey: "testimonial_luqman_role", quoteKey: "testimonial_luqman_quote" },
  { name: "Chen W.", roleKey: "testimonial_chen_role", quoteKey: "testimonial_chen_quote" },
];

export function SocialProof() {
  const { formatted: memberCount } = useMemberCount();
  const { t } = useTranslation();
  return (
    <Section id="testimonials" className="bg-surface/40">
      <SectionHeading
        eyebrow={t("social_eyebrow")}
        title={t("social_title").replace("{memberCount}", memberCount)}
        subtitle={t("social_subtitle")}
      />
      <div className="mb-10 grid gap-4">
        {[
          [Clock, "24/5", t("social_market_coverage")],
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
        {TESTIMONIALS.map((item, i) => (
          <Reveal key={item.name} delay={i * 0.04} className="h-full w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)] lg:max-w-xs">
          <figure className="glass-card flex h-full flex-col rounded-xl p-6">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <blockquote className="mt-3 flex-1 text-sm text-body">"{t(item.quoteKey)}"</blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-semibold">{item.name}</span>
              <span className="block text-xs text-muted-foreground">{t(item.roleKey)}</span>
              {item.verifiedHandle ? (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                  <ShieldCheck className="h-3 w-3" /> {t("testimonial_verified")}
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

export const FAQ_GROUPS: { titleKey: TranslationKey; items: { qKey: TranslationKey; aKey: TranslationKey }[] }[] = [
  {
    titleKey: "faq_group1_title",
    items: [
      { qKey: "faq_g1_q1", aKey: "faq_g1_a1" },
      { qKey: "faq_g1_q2", aKey: "faq_g1_a2" },
      { qKey: "faq_g1_q3", aKey: "faq_g1_a3" },
      { qKey: "faq_g1_q4", aKey: "faq_g1_a4" },
      { qKey: "faq_g1_q5", aKey: "faq_g1_a5" },
    ],
  },
  {
    titleKey: "faq_group2_title",
    items: [
      { qKey: "faq_g2_q1", aKey: "faq_g2_a1" },
      { qKey: "faq_g2_q2", aKey: "faq_g2_a2" },
      { qKey: "faq_g2_q3", aKey: "faq_g2_a3" },
      { qKey: "faq_g2_q4", aKey: "faq_g2_a4" },
    ],
  },
  {
    titleKey: "faq_group3_title",
    items: [
      { qKey: "faq_g3_q1", aKey: "faq_g3_a1" },
      { qKey: "faq_g3_q2", aKey: "faq_g3_a2" },
      { qKey: "faq_g3_q3", aKey: "faq_g3_a3" },
      { qKey: "faq_g3_q4", aKey: "faq_g3_a4" },
    ],
  },
];

export function Faq() {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const { t } = useTranslation();
  return (
    <Section id="faq">
      <SectionHeading eyebrow={t("faq_eyebrow")} title={t("faq_title")} />
      <div className="mx-auto max-w-3xl space-y-10">
        {FAQ_GROUPS.map((g, gi) => (
          <div key={g.titleKey}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {t(g.titleKey)}
            </h3>
            <div className="space-y-3">
              {g.items.map((f, i) => {
                const id = `${gi}-${i}`;
                return (
                  <Reveal key={f.qKey} delay={i * 0.04} y={20}>
                  <div className="glass-card overflow-hidden rounded-xl">
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-expanded={openIds.includes(id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold">{t(f.qKey)}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openIds.includes(id) ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openIds.includes(id) ? (
                      <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-body">
                        {t(f.aKey)}
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
  const { t } = useTranslation();
  return (
    <Section id="get-started" className="bg-surface/40">
      <Reveal>
      <div className="glass-card rounded-xl px-6 py-14 text-center sm:px-12">
        <h2 className="text-3xl sm:text-4xl">{t("final_title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-body">
          {t("final_body")}
        </p>
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

export function Footer() {
  const botHref = useBotLink();
  const { t, locale } = useTranslation();
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              {t("footer_tagline")}
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
            <h3 className="text-sm font-semibold">{t("footer_navigate")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[...NAV_ITEMS, ...FOOTER_ONLY_ITEMS].map((i) => (
                <li key={i.href}>
                  <a href={localizePath(i.href, locale)} className="hover:text-foreground">
                    {t(i.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer_links")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={botHref} onClick={() => goTrack("footer_bot")} className="hover:text-foreground">
                  {t("footer_enrollment_bot")}
                </a>
              </li>
              <li>
                <a href={LINKS.support} onClick={() => goTrack("footer_support")} className="hover:text-foreground">
                  {t("footer_support")}
                </a>
              </li>
              <li>
                <a href={LINKS.macro} onClick={() => goTrack("footer_macro")} className="hover:text-foreground">
                  {t("footer_macro_fundamentals")}
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-foreground">
                  {t("nav_my_account")}
                </Link>
              </li>
              <li>
                <a href={LINKS.vantage} onClick={() => goTrack("footer_vantage")} className="hover:text-foreground">
                  {t("footer_vantage_markets")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer_legal")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to={locale === "ms" ? "/ms/privacy" : "/privacy"} className="hover:text-foreground">
                  {t("footer_privacy")}
                </Link>
              </li>
              <li>
                <Link to={locale === "ms" ? "/ms/terms" : "/terms"} className="hover:text-foreground">
                  {t("footer_terms")}
                </Link>
              </li>
              <li>
                <a href={LINKS.support} onClick={() => goTrack("footer_contact")} className="hover:text-foreground">
                  {t("footer_contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>{t("footer_copyright")}</p>
          <p>{t("footer_risk_disclaimer")}</p>
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
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main>
          <Hero />
          <TrustStrip />
          <StatsStrip />
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
