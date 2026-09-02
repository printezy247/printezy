import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
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
  LineChart,
  Bot,
} from "lucide-react";
import {
  track,
  trackPageLoad,
  trackEngagement,
  trackSectionVisibility,
  trackAdClick,
  getSessionId,
  metaTrack,
  type SiteMetaEvent,
} from "@/lib/analytics";

const jackPhoto = "/__l5e/assets-v1/a88ab471-0335-452e-86ce-a8f7301811e3/jack-photo.png";
const brandLogo = "/__l5e/assets-v1/1d73bbe2-5c3b-4399-8e48-1eace4a5ed77/ezymap-logo.png";
const macroLogo = "/__l5e/assets-v1/398fbb63-d47e-4553-8892-9dfb7bda17d4/macro-logo.png";

const ebookMapping = "/__l5e/assets-v1/b177d46a-680e-4021-ae98-bcc3631ab665/ebook-mapping-like-pro.png";
const ebookTechnical = "/__l5e/assets-v1/eb540617-0a0b-4444-993e-d90be97af7d7/ebook-technical-analysis.png";

const tierFree = "/__l5e/assets-v1/174daaab-2584-456e-a536-500846c6e53a/tier-beginner.jpg";
const tierPro = "/__l5e/assets-v1/b081a13c-b17d-495f-addf-bf83f9f20930/tier-pro.jpg";
const tierPremium = "/__l5e/assets-v1/aed9ef52-2740-4a48-83db-2b807a45e958/tier-premium.jpg";
const tierElite = "/__l5e/assets-v1/74dd6c4b-6aa9-466c-89ab-b1e0b75b28ac/tier-elite.jpg";

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
};

/** Site clicks that are also Meta conversions, with the tier value where known. */
const META_CLICK_EVENTS: Record<
  string,
  { event: SiteMetaEvent; contentId?: string; valueCents?: number }
> = {
  pricing_free: { event: "Lead", contentId: "free" },
  pricing_vantage_trial: { event: "StartTrial", contentId: "vantage" },
  pricing_pro: { event: "InitiateCheckout", contentId: "pro", valueCents: 4900 },
  pricing_premium: { event: "InitiateCheckout", contentId: "premium", valueCents: 9900 },
  pricing_elite: { event: "InitiateCheckout", contentId: "elite", valueCents: 29900 },
  hero_bot_link: { event: "Lead", contentId: "hero" },
  hero_primary: { event: "Lead", contentId: "hero" },
  support_click: { event: "Lead", contentId: "support" },
};

function goTrack(name: string) {
  track("click", name);
  const meta = META_CLICK_EVENTS[name];
  if (meta) {
    metaTrack(meta.event, {
      id: name,
      contentName: name,
      contentId: meta.contentId,
      valueCents: meta.valueCents,
    });
  }
}

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
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: APPLE_EASE }}
    >
      {children}
    </motion.div>
  );
}

function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`py-20 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function SectionHeading({
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        ) : null}
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        {subtitle ? <p className="mt-4 text-base text-muted-foreground">{subtitle}</p> : null}
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
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary-glow shadow-green"
      : variant === "gold"
        ? "bg-accent text-accent-foreground hover:bg-accent-glow shadow-gold"
        : "border border-border bg-surface text-foreground hover:bg-surface-elevated";
  return (
    <a
      href={href}
      onClick={() => goTrack(event)}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${styles} ${className}`}
    >
      <Send className="h-4 w-4" />
      {label}
    </a>
  );
}

function SupportCta({ className = "" }: { className?: string }) {
  return (
    <a
      href={LINKS.support}
      onClick={() => goTrack("support_click")}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 ${className}`}
    >
      <Send className="h-4 w-4" /> Ask Sarah
    </a>
  );
}

function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src={brandLogo}
        alt="EzyMap ALGO logo"
        className="h-9 w-9 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.35)]"
      />
      <span className="font-display text-lg font-bold tracking-tight">
        EzyMap <span className="text-gradient-gold">ALGO</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "Packages", href: "#packages" },
  { label: "Products", href: "#products" },
  { label: "About Jack", href: "#ambassador" },
  { label: "FAQ", href: "#faq" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="EzyMap ALGO home">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <SupportCta />
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-border/60 bg-background md:hidden">
          <ul className="space-y-1 px-4 py-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <SupportCta className="w-full" />
            </li>
          </ul>
        </div>
      ) : null}
    </header>
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
  const botHref = useBotLink();
  return (
    <section className="relative overflow-hidden bg-hero pt-32 pb-20 sm:pt-40 sm:pb-24">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-glow opacity-40 blur-3xl" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: APPLE_EASE }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Activity className="h-3.5 w-3.5" /> 640+ active traders
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
            Professional Trading Routines
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Live signals and daily education powered by TradingView indicators, delivered straight
            to your phone on Telegram. Forex, crypto and commodities, 24/5.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <TelegramCta label="Join Free Channel" event="hero_join_free" className="px-7 py-3.5 text-base" />
            <a
              href="#packages"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-surface"
            >
              See packages <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Or upgrade to Pro, Premium, or Elite through{" "}
            <a href={botHref} onClick={() => goTrack("hero_bot_link")} className="text-primary hover:underline">
              our bot
            </a>
            .
          </p>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ["1,500+", "Pips Weekly"],
              ["85%", "Win Rate"],
              ["3 Styles", "Scalp · Intraday · Swing"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-2xl font-bold text-accent">{v}</dt>
                <dd className="text-xs uppercase tracking-wide text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl p-5 shadow-elevated"
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: APPLE_EASE }}
        >
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">XAUUSD · M5</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> LIVE
            </span>
          </div>
          <div className="h-44 sm:h-56">
            <ChartGraphic />
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Signal alert</p>
            <p className="mt-1 text-sm text-foreground">
              BUY setup confirmed — entry, stop and targets pushed to Telegram in real time.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { icon: Zap, title: "Real-time Signals", body: "Instant alerts the moment a setup forms on our indicators." },
  { icon: GraduationCap, title: "Live Education", body: "Learn proven, mechanical trading strategies from Jack." },
  { icon: Users, title: "Community", body: "Connect with 640+ traders worldwide inside Telegram." },
  { icon: Smartphone, title: "Mobile First", body: "Get alerts anywhere, anytime — no terminal required." },
];

export function Features() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="What you get"
        title="Built for traders who want clarity"
        subtitle="Everything runs through Telegram, so you never miss a setup while you're away from the charts."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08} className="h-full">
          <article className="glass-card h-full rounded-2xl p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
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
  features: string[];
  cta: string;
  href: string;
  event: string;
  highlight?: boolean;
  image?: string;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    blurb: "No payment required",
    features: [
      "Join our 640+ trader community",
      "Daily signals & education",
      "Public channel access",
      "Enroll through our bot",
    ],
    cta: "Enroll Now",
    href: LINKS.bot,
    event: "pricing_free",
    image: tierFree,
  },
  {
    name: "Vantage Trial",
    blurb: "Pro access free for 30 days",
    features: [
      "No card required",
      "Open a Vantage Markets account to unlock",
      "Pro signal feed, trade log & stats",
      "Activate through our bot",
    ],
    cta: "Get Free Access",
    href: LINKS.bot,
    event: "pricing_vantage_trial",
  },
  {
    name: "Pro",
    blurb: "Scalp Mastery Signals",
    features: ["M5 Timeframe Strategies", "Real-time Alerts", "Enroll through our bot"],
    cta: "Enroll Now",
    href: LINKS.bot,
    event: "pricing_pro",
    image: tierPro,
  },
  {
    name: "Premium",
    blurb: "Alpha Edge Signals",
    features: [
      "M15-M30 Intraday",
      "Advanced Analysis",
      "Priority Support",
      "Enroll through our bot",
    ],
    cta: "Enroll Now",
    href: LINKS.bot,
    event: "pricing_premium",
    highlight: true,
    image: tierPremium,
  },
  {
    name: "Elite",
    blurb: "Full Suite",
    features: [
      "All indicators included",
      "1-on-1 Coaching with Jack",
      "Custom Strategies",
      "Premium Support",
      "Enroll through our bot",
    ],
    cta: "Enroll Now",
    href: LINKS.bot,
    event: "pricing_elite",
    image: tierElite,
  },
];

export function Pricing() {
  const botHref = useBotLink();
  return (
    <Section id="packages" className="bg-surface/40">
      <SectionHeading
        eyebrow="Packages"
        title="Start free. Upgrade when you're ready."
        subtitle="All tiers enroll through our bot. Want to test the desk first? Open a Vantage Markets account and get 30 days of Pro access free — no card required."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TIERS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1} className="h-full">
          <article
            className={`relative flex h-full flex-col overflow-hidden rounded-2xl ${
              t.highlight
                ? "border border-accent/40 bg-surface-elevated shadow-gold"
                : "glass-card"
            }`}
          >
            {t.highlight ? (
              <span className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
                Most popular
              </span>
            ) : null}
            {t.image ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#050806]">
                <img
                  src={t.image}
                  alt={`${t.name} package preview`}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-elevated/90 to-transparent" />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t.name}
              </h3>
              <p className="mt-3 text-lg font-semibold text-foreground">{t.blurb}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={t.href === LINKS.bot ? botHref : t.href}
                onClick={() => goTrack(t.event)}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                  t.highlight
                    ? "bg-accent text-accent-foreground hover:bg-accent-glow"
                    : "bg-primary text-primary-foreground hover:bg-primary-glow"
                }`}
              >
                {t.cta}
              </a>
            </div>
          </article>
          </Reveal>
        ))}
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

const EBOOKS = [
  { title: "Mapping Like A Pro", image: ebookMapping },
  { title: "Technical Analysis Ebook", image: ebookTechnical },
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
            <Reveal key={b.title} delay={i * 0.1}>
            <a
              href={LINKS.ebook}
              onClick={() => goTrack(`ebook_${b.title.toLowerCase().replace(/\s+/g, "_")}`)}
              className="glass-card group overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[2/3] w-full overflow-hidden">
                <img
                  src={b.image}
                  alt={`${b.title} cover`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Get it free <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </a>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* TradingView indicators */}
        <Reveal className="h-full">
        <article className="glass-card h-full rounded-2xl p-6">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <LineChart className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">TradingView Indicators</h3>
          <ul className="mt-4 space-y-2.5">
            {TV_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          <a
            href={botHref}
            onClick={() => goTrack("products_tv_enroll")}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Enroll Now <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </article>
        </Reveal>

        {/* MT5 indicators */}
        <Reveal className="h-full" delay={0.1}>
        <article className="glass-card h-full rounded-2xl p-6">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Bot className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">MT5 Indicators</h3>
          <ul className="mt-4 space-y-2.5">
            {MT5_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          <a
            href={botHref}
            onClick={() => goTrack("products_mt5_enroll")}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Enroll Now <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </article>
        </Reveal>

        {/* Macro & Fundamentals */}
        <Reveal className="h-full" delay={0.2}>
        <article className="glass-card relative h-full overflow-hidden rounded-2xl p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-glow opacity-30 blur-2xl" />
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
          <ul className="mt-4 space-y-2.5">
            {["Daily macro updates", "Economic analysis", "Gold & crypto coverage"].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          <a
            href={LINKS.macro}
            onClick={() => goTrack("products_macro_join")}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            <Send className="h-4 w-4" /> Join Macro Bot
          </a>
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
  return (
    <Section id="how-it-works" className="bg-surface/40">
      <SectionHeading eyebrow="How it works" title="Three steps to your first signal" />
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            className="glass-card relative rounded-2xl p-6"
            initial={{ opacity: 0, y: 32, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: i * 0.12, ease: APPLE_EASE }}
          >
            <span className="font-display text-4xl font-bold text-accent/40">0{i + 1}</span>
            <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
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
  return (
    <Section id="ambassador">
      <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
        <div className="glass-card relative overflow-hidden rounded-2xl p-8 text-center">
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
          <a
            href={LINKS.support}
            onClick={() => goTrack("ambassador_contact_sarah")}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            <Send className="h-4 w-4" /> Questions? Ask Sarah
          </a>
        </div>
        </Reveal>

        <Reveal delay={0.15}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ambassador</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Meet Jack</h2>
          <p className="mt-4 text-base text-muted-foreground">
            Jack focuses on one thing: repeatable, mechanical execution.
          </p>
          <blockquote className="mt-6 border-l-2 border-accent pl-4 text-lg italic text-foreground">
            "Consistent wins come from consistent methodology."
          </blockquote>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["640+", "Students"],
              ["10+ yrs", "Trading"],
              ["24/5", "Coverage"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-border bg-surface p-4">
                <dt className="text-xl font-bold text-accent">{v}</dt>
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

const TESTIMONIALS = [
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
  return (
    <Section id="testimonials" className="bg-surface/40">
      <SectionHeading
        eyebrow="Social proof"
        title="640+ active traders trust EzyMap"
        subtitle="Real feedback from the community inside our Telegram channels."
      />
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          [Activity, "3.2K+", "Signals delivered this month"],
          [Clock, "24/5", "Market coverage"],
          [ShieldCheck, "0%", "Spam, ever"],
        ].map(([Icon, v, l], i) => {
          const I = Icon as typeof Activity;
          return (
            <Reveal key={l as string} delay={i * 0.08}>
            <div className="glass-card flex h-full items-center gap-4 rounded-2xl p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <I className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xl font-bold">{v as string}</p>
                <p className="text-xs text-muted-foreground">{l as string}</p>
              </div>
            </div>
            </Reveal>
          );
        })}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.08} className="h-full">
          <figure className="glass-card flex h-full flex-col rounded-2xl p-6">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <blockquote className="mt-3 flex-1 text-sm text-muted-foreground">"{t.quote}"</blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-semibold">{t.name}</span>
              <span className="block text-xs text-muted-foreground">{t.role}</span>
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
        a: "Yes, two. The Free tier gives you the public channel and starter education, forever free. The Vantage Trial unlocks 30 days of Pro-level access free after you activate a Vantage Markets account — no card required.",
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
        a: "Yes — every paid tier comes with a 30-day money-back guarantee. Message support through the bot and we'll take care of it.",
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
        q: "How does the Vantage Trial work?",
        a: "Choose the Vantage Trial in the bot, open your Vantage Markets account through the provided link, then tap “I've activated”. Your Pro-level access unlocks immediately and expires automatically after 30 days.",
      },
      {
        q: "Who do I contact for help?",
        a: "Use the 💬 Ask Sarah button in the bot (or /ask) for live chat with our support lead, or reach her directly at t.me/ezysarah.",
      },
    ],
  },
];

export function Faq() {
  const [open, setOpen] = useState<string | null>("0-0");
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
                  <Reveal key={f.q} delay={i * 0.06} y={20}>
                  <div className="glass-card overflow-hidden rounded-xl">
                    <button
                      type="button"
                      onClick={() => setOpen(open === id ? null : id)}
                      aria-expanded={open === id}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold">{f.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open === id ? "rotate-180" : ""}`}
                      />
                    </button>
                    {open === id ? (
                      <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>
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
      <div className="glass-card rounded-3xl px-6 py-14 text-center sm:px-12">
        <h2 className="text-3xl font-bold sm:text-4xl">Start with the free channel today</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
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
              {NAV_ITEMS.map((i) => (
                <li key={i.href}>
                  <a href={`/${i.href}`} className="hover:text-foreground">
                    {i.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/faq" className="hover:text-foreground">
                  FAQ
                </Link>
              </li>
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
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Products />
        <HowItWorks />
        <Ambassador />
        <SocialProof />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
