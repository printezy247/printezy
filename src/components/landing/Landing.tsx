import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  Crown,
  Gauge,
  LineChart,
  Lock,
  Map,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import logoAsset from "@/assets/printezy-logo-transparent.png.asset.json";
import heroMonitorUrl from "@/assets/ezymap-hero-monitor.jpg?url";
import jackSilhouetteUrl from "@/assets/jack-silhouette.jpg?url";
import ebooksPedestalUrl from "@/assets/ebooks-pedestal.jpg?url";
import telegramCommunityAsset from "@/assets/telegram-community-tech.jpg.asset.json";
import chart1Asset from "@/assets/chart-1.jpg.asset.json";
import chart2Asset from "@/assets/chart-2.jpg.asset.json";
import chart3Asset from "@/assets/chart-3.jpg.asset.json";
import chart4Asset from "@/assets/chart-4.jpg.asset.json";
import chart5Asset from "@/assets/chart-5.jpg.asset.json";
import chart6Asset from "@/assets/chart-6.jpg.asset.json";
import blankChartAsset from "@/assets/blank-chart.jpg.asset.json";
import ebookTAAsset from "@/assets/ebook-technical-analysis.png.asset.json";
import ebookMapAsset from "@/assets/ebook-mapping-like-pro.png.asset.json";

const logo = { url: logoAsset.url };
const heroMonitor = { url: heroMonitorUrl };
const jackSilhouette = { url: jackSilhouetteUrl };
const ebooksPedestal = { url: ebooksPedestalUrl };
const telegramPhone = { url: telegramCommunityAsset.url };
const CHARTS = {
  goldIntradayLive: chart1Asset.url,
  goldScalpLive: chart2Asset.url,
  goldScalpReady: chart3Asset.url,
  goldSwingReady: chart4Asset.url,
  btcSwingReady: chart5Asset.url,
  btcScalpLive: chart6Asset.url,
  blank: blankChartAsset.url,
};
const EBOOK_COVERS = {
  technicalAnalysis: ebookTAAsset.url,
  mappingLikePro: ebookMapAsset.url,
};
import { track, trackPageLoad, trackSectionVisibility, trackEngagement } from "@/lib/analytics";
import { Link } from "@tanstack/react-router";

// -------- Links --------
const LINKS = {
  vantage: "https://www.vantagemarketsea.com/ms/open-live-account/?affid=MjY0NjgwMDg%3D&invitecode=oQQlQ8yM",
  ezymapLite: "https://t.me/m/GnnwtgRyMDBl",
  proSoftware: "https://t.me/m/BWf8zJWRMWQ1",
  proPartner: "https://t.me/jackprintezy",
  support: "https://t.me/jackprintezy",
  channel: "https://t.me/printezybyjack",
  ebook: "https://t.me/printezybyjack/2854",
  tradingview: "https://www.tradingview.com/pricing/?share_your_love=printezyusd",
};



const NAV_ITEMS = [
  { label: "EzyMap", href: "#ezymap" },
  { label: "How it works", href: "#how" },
  { label: "Products", href: "#ladder" },
  { label: "Education", href: "#education" },
  { label: "Results", href: "#results" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

// ============== NAV ==============
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl bg-background/70 border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-18">
        <a href="#top" className="flex items-center gap-2 shrink-0" aria-label="PrintEzy home">
          <img src={logo.url} alt="PrintEzy" className="h-9 sm:h-11 w-auto" />
        </a>
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map((i) => (
            <a
              key={i.href}
              href={i.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {i.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={LINKS.ezymapLite}
            rel="noopener noreferrer"
            onClick={() => track("click", "nav_lite")}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs sm:text-sm text-foreground/90 hover:bg-white/5 transition-colors"
          >
            Get Lite Free
          </a>
          <a
            href={LINKS.vantage}
            rel="noopener noreferrer"
            onClick={() => track("click", "nav_open_account")}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-green"
          >
            Open Account <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <button
            className="lg:hidden ml-1 grid h-9 w-9 place-items-center rounded-full border border-white/10"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">Menu</span>
            <div className="space-y-1">
              <span className="block h-px w-4 bg-foreground/80" />
              <span className="block h-px w-4 bg-foreground/80" />
            </div>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {NAV_ITEMS.map((i) => (
                <a
                  key={i.href}
                  href={i.href}
                  onClick={() => setOpen(false)}
                  className="text-base text-foreground/90 py-2"
                >
                  {i.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ============== HERO ==============
function Hero() {
  const reduce = useReducedMotion();
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-36 pb-16 sm:pb-24">
      {/* ambient glow */}
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-glow)" }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-foreground/80 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            EzyMap — trade the plan, not the noise
          </div>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-foreground">
            <span className="block">Map it.</span>
            <span className="block text-gradient-green">Plan it.</span>
            <span className="block text-gradient-gold">Print it.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            PrintEzy is a premium trading education and analytics ecosystem. EzyMap turns Gold and BTC charts into
            structured setups with clear zones, alerts, and a live trade plan — so you stop guessing and start executing.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
            <PrimaryCta
              label="Get EzyMap Lite Free"
              href={LINKS.ezymapLite}
              tone="green"
              trackName="hero_lite"
              icon={Sparkles}
            />
            <PrimaryCta
              label="Free Pro Analysis"
              href={LINKS.tradingview}
              tone="ghost"
              trackName="hero_tradingview"
              icon={LineChart}
            />
          </div>
          <div className="mt-4 flex justify-center">
            <a
              href={LINKS.support}
              rel="noopener noreferrer"
              onClick={() => track("click", "hero_support")}
              className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/5 px-3.5 py-1.5 text-[11px] sm:text-xs text-secondary hover:bg-secondary/10 transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
              Chat with PrintEzy Support
            </a>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/70">
            Free Pro Analysis uses our TradingView referral link — makes indicator install & usage easier.
          </p>

          <p className="mt-4 text-xs text-muted-foreground/80">
            No signup walls. Education-first. Trading involves risk.
          </p>
        </motion.div>


        {/* Chart-in-monitor visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative mt-14 sm:mt-20"
        >
          <div
            aria-hidden
            className="absolute -inset-x-10 -inset-y-6 blur-3xl opacity-60 -z-10"
            style={{ background: "var(--gradient-glow)" }}
          />
          <div className="relative mx-auto max-w-5xl">
            <img
              src={heroMonitor.url}
              alt="EzyMap chart with mapped supply and demand zones on a premium display"
              width={1600}
              height={1200}
              className="w-full h-auto rounded-2xl"
            />
            {/* floating READY→LIVE chips */}
            {!reduce && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="absolute left-4 top-6 sm:left-10 sm:top-14 rounded-xl border border-primary/30 bg-background/70 backdrop-blur-md px-3 py-2 text-xs shadow-green"
                >
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> READY
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.6 }}
                  className="absolute right-4 bottom-8 sm:right-10 sm:bottom-16 rounded-xl border border-accent/30 bg-background/70 backdrop-blur-md px-3 py-2 text-xs shadow-gold"
                >
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Alert</div>
                  <div className="text-accent font-semibold">Gold — Demand tap</div>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PrimaryCta({
  label,
  href,
  tone,
  trackName,
  icon: Icon,
}: {
  label: string;
  href: string;
  tone: "green" | "gold" | "ghost";
  trackName: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const cls =
    tone === "green"
      ? "bg-primary text-primary-foreground shadow-green hover:brightness-110"
      : tone === "gold"
      ? "bg-accent text-accent-foreground shadow-gold hover:brightness-110"
      : "border border-white/15 text-foreground hover:bg-white/5";
  return (
    <a
      href={href}
      rel="noopener noreferrer"
      onClick={() => track("click", trackName)}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all ${cls}`}
    >
      {label}
      <Icon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

// ============== TRUST BAR ==============
function TrustBar() {
  const items = [
    "Powered by TradingView",
    "Regulated broker: Vantage",
    "24/7 Telegram community",
    "Education-first",
    "No guaranteed profits",
  ];
  return (
    <section className="border-y border-white/5 bg-surface/40 backdrop-blur-md py-6">
      <div className="mx-auto max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-widest text-muted-foreground">
          {items.map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" /> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============== SECTION SHELL ==============
function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  center = false,
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  center?: boolean;
}) {
  return (
    <section id={id} className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
          {eyebrow && (
            <div className="text-xs uppercase tracking-[0.2em] text-primary/90 font-medium">{eyebrow}</div>
          )}
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight">
            {title}
          </h2>
          {intro && <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">{intro}</p>}
        </div>
        <div className="mt-12 sm:mt-16">{children}</div>
      </div>
    </section>
  );
}

// ============== PROBLEM ==============
function Problem() {
  const items = [
    { icon: Compass, title: "Signals with no context", desc: "Random pings without bias, structure, or risk framing." },
    { icon: Zap, title: "Endless YouTube loops", desc: "Hours of content, zero repeatable process for tomorrow's session." },
    { icon: Gauge, title: "Screen-staring days", desc: "Watching every tick while burning out from work and life." },
    { icon: Lock, title: "Locked behind paywalls", desc: "Real edge hidden behind $500 courses that never load a chart." },
  ];
  return (
    <Section
      id="problem"
      eyebrow="The problem"
      title={<>Trading shouldn't feel <span className="text-gradient-gold">random</span>.</>}
      intro="Most traders don't lose because they lack information — they lose because there's no structure to their day. PrintEzy exists to fix that."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <div className="mt-5 font-display text-lg">{it.title}</div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

// ============== EZYMAP INTRO WITH MODE SWITCHER ==============
const MODES = [
  {
    key: "scalping",
    label: "Scalping",
    tf: "1m · 5m · 15m",
    desc: "Fast micro-structure zones for intraday scalpers. Alerts fire the second price taps a mapped level.",
    accent: "green" as const,
    img: CHARTS.goldScalpLive,
    status: "LIVE" as const,
  },
  {
    key: "intraday",
    label: "Intraday",
    tf: "15m · 1h · 4h",
    desc: "Session-based bias with clear supply and demand mapped before New York open. Trade the plan, not the wick.",
    accent: "gold" as const,
    img: CHARTS.goldIntradayLive,
    status: "LIVE" as const,
  },
  {
    key: "swing",
    label: "Swing",
    tf: "4h · 1D · 1W",
    desc: "Higher-timeframe map for busy professionals. Check charts once a day, execute when zones align.",
    accent: "green" as const,
    img: CHARTS.goldSwingReady,
    status: "READY" as const,
  },
];



function EzyMapIntro() {
  const [mode, setMode] = useState(MODES[1].key);
  const active = MODES.find((m) => m.key === mode)!;
  return (
    <Section
      id="ezymap"
      eyebrow="Introducing EzyMap"
      title={
        <>
          One system.<br />
          <span className="text-gradient-green">Three modes.</span> Every trader.
        </>
      }
      intro="EzyMap is a TradingView-based mapping system that reads market structure across timeframes. Pick the mode that matches your life — the system does the heavy lifting."
    >
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-center">
        {/* Mode switcher */}
        <div className="space-y-3">
          {MODES.map((m) => {
            const isActive = m.key === mode;
            return (
              <button
                key={m.key}
                onClick={() => {
                  setMode(m.key);
                  track("click", `ezymap_mode_${m.key}`);
                }}
                className={`w-full text-left rounded-2xl border p-5 transition-all ${
                  isActive
                    ? "border-primary/40 bg-primary/5 shadow-green"
                    : "border-white/8 hover:border-white/15 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-xl">{m.label}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${isActive ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                    {m.tf}
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 text-sm text-muted-foreground leading-relaxed overflow-hidden"
                    >
                      {m.desc}
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
        {/* Preview panel */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-3xl p-4 sm:p-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black">
            <img
              src={active.img}
              alt={`EzyMap ${active.label} mode live chart`}
              loading="lazy"
              className="w-full h-auto max-h-[520px] object-contain mx-auto"
            />
            <div className="absolute top-4 left-4 rounded-full bg-background/70 backdrop-blur-md border border-white/10 px-3 py-1 text-xs">
              <span className={`font-semibold ${active.accent === "gold" ? "text-accent" : "text-primary"}`}>
                {active.label} mode
              </span>{" "}
              <span className="text-muted-foreground">· {active.tf}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              { k: "Bias", v: "Long" },
              { k: "Zone", v: "Demand" },
              { k: "Status", v: active.status },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-white/5 bg-white/[0.02] py-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.k}</div>
                <div className={`mt-1 text-sm font-semibold ${s.k === "Status" && s.v === "LIVE" ? "text-primary" : "text-foreground"}`}>{s.v}</div>
              </div>
            ))}
          </div>

        </motion.div>
      </div>
    </Section>
  );
}

// ============== HOW IT WORKS ==============
function HowItWorks() {
  const steps = [
    { icon: Map, label: "MAP", desc: "Every session, EzyMap plots supply and demand zones across your chosen timeframes." },
    { icon: Target, label: "READY", desc: "Setups that meet criteria light up as READY — bias, invalidation, and target all pre-defined." },
    { icon: Zap, label: "LIVE", desc: "Price taps the zone → alert fires. You get entry, stop, and target on your phone." },
    { icon: TrendingUp, label: "MANAGE", desc: "Move stops, take partials, or invalidate. The system tracks the trade so you don't have to." },
  ];
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title={
        <>
          A workflow, not a signal.<br />
          <span className="text-gradient-green">Four steps.</span> Every session.
        </>
      }
    >
      <div className="relative">
        <div aria-hidden className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-accent/30 to-transparent" />
        <div className="space-y-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative pl-16 sm:pl-0 sm:grid sm:grid-cols-2 sm:gap-8 items-center"
            >
              <div className={`${i % 2 === 1 ? "sm:col-start-2" : ""} sm:text-right sm:pr-12`}>
                <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-0 grid h-12 w-12 place-items-center rounded-full border border-primary/30 bg-background text-primary shadow-green">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className={`${i % 2 === 1 ? "sm:hidden" : ""}`}>
                  <div className="text-xs uppercase tracking-[0.25em] text-primary/80">Step {i + 1}</div>
                  <div className="mt-1 font-display text-2xl sm:text-3xl">{s.label}</div>
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md sm:ml-auto">{s.desc}</p>
                </div>
              </div>
              <div className={`hidden sm:block ${i % 2 === 1 ? "sm:col-start-1 sm:row-start-1 sm:text-right sm:pr-12" : "sm:pl-12"}`}>
                {i % 2 === 1 ? (
                  <div className="sm:text-right">
                    <div className="text-xs uppercase tracking-[0.25em] text-primary/80">Step {i + 1}</div>
                    <div className="mt-1 font-display text-2xl sm:text-3xl">{s.label}</div>
                    <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md sm:ml-auto">{s.desc}</p>
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl p-5 text-sm text-muted-foreground">
                    <span className="text-primary font-semibold">Example:</span>{" "}
                    {i === 0 && "Gold H4 — supply 2,435 / demand 2,388 mapped pre-London."}
                    {i === 2 && "BTC 1H tapped 68,200 demand at 09:14 UTC. Alert sent."}
                  </div>
                )}
              </div>
              {i % 2 === 0 && (
                <div className="sm:hidden mt-4">
                  <div className="glass-card rounded-2xl p-4 text-xs text-muted-foreground">
                    <span className="text-primary font-semibold">Example:</span>{" "}
                    {i === 0 && "Gold H4 — supply 2,435 / demand 2,388 mapped pre-London."}
                    {i === 2 && "BTC 1H tapped 68,200 demand at 09:14 UTC. Alert sent."}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ============== WORKFLOW DEMO ==============
function WorkflowDemo() {
  return (
    <Section
      id="demo"
      eyebrow="See it live"
      title={<>Before EzyMap. <span className="text-gradient-green">After EzyMap.</span></>}
      intro="Same chart. Same market. Two very different states of mind."
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-3xl p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Before</div>
          <div className="mt-1 font-display text-xl">Blank chart. Blank plan.</div>
          <div className="mt-5 relative rounded-2xl overflow-hidden border border-white/5 bg-black">
            <img
              src={CHARTS.blank}
              alt="Blank chart before EzyMap mapping"
              loading="lazy"
              className="w-full h-auto max-h-[520px] object-contain mx-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="px-4 py-2 rounded-full bg-background/70 backdrop-blur-md border border-white/10 text-sm text-foreground/90 font-medium">
                "Where do I even enter?"
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 relative overflow-hidden">
          <div aria-hidden className="absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-glow)" }} />
          <div className="text-xs uppercase tracking-widest text-primary">After</div>
          <div className="mt-1 font-display text-xl">Mapped. Ready. Executed.</div>
          <div className="mt-5 rounded-2xl overflow-hidden border border-primary/20">
            <img src={CHARTS.goldIntradayLive} alt="EzyMap after view — mapped intraday buy" loading="lazy" className="w-full h-auto max-h-[520px] object-contain mx-auto bg-black" />
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <a
          href={LINKS.ezymapLite}
          rel="noopener noreferrer"
          onClick={() => track("click", "demo_lite")}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5"
        >
          <Play className="h-4 w-4" /> See a live example on Telegram
        </a>
      </div>
    </Section>
  );
}

// ============== PRODUCT LADDER ==============
function ProductLadder() {
  const tiers = [
    {
      name: "EzyMap Lite",
      price: "Free",
      tag: "Start here",
      desc: "Daily mapped charts on our public Telegram. See the workflow in action, zero commitment.",
      features: [
        "Daily Gold + BTC bias post",
        "Sample mapped setups",
        "Educational breakdowns",
        "Community discussion",
      ],
      cta: { label: "Join Free Channel", href: LINKS.channel, tone: "ghost" as const, track: "ladder_lite" },
      highlight: false,
    },
    {
      name: "EzyMap Pro Software",
      price: "$29",
      priceNote: "/ month · or $69 lifetime",
      tag: "Best for self-trained",
      desc: "The TradingView indicator suite. Your charts, your entries, our mapping engine.",
      features: [
        "TradingView indicator access",
        "All 3 modes (Scalping / Intraday / Swing)",
        "READY & LIVE alerts",
        "Private strategy channel",
        "Setup videos + install support",
      ],
      cta: { label: "Get Software Access", href: LINKS.proSoftware, tone: "green" as const, track: "ladder_pro_software" },
      highlight: true,
    },
    {
      name: "EzyMap Pro Partner",
      price: "Free",
      priceNote: "with Vantage partner account",
      tag: "Best for hands-on learners",
      desc: "Full software + mentored community access when you open a live account through our Vantage partner link.",
      features: [
        "Everything in Pro Software",
        "Priority partner Telegram",
        "Support onboarding call",
        "Trade reviews with Jack",
        "Ongoing plan refinement",
      ],
      cta: { label: "Open Vantage Account", href: LINKS.vantage, tone: "gold" as const, track: "ladder_partner" },
      highlight: false,
      badge: "Partner offer",
    },
  ];
  return (
    <Section
      id="ladder"
      eyebrow="Choose your access"
      title={<>Three ways in. <span className="text-gradient-gold">One system.</span></>}
      intro="Start free on Telegram, level up to the Pro software, or unlock full mentorship as a Vantage partner. No hidden upsells."
    >
      <div className="grid lg:grid-cols-3 gap-5">
        {tiers.map((t) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className={`relative rounded-3xl p-7 border transition-all ${
              t.highlight
                ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent shadow-green"
                : "border-white/8 bg-white/[0.02] glass-card"
            }`}
          >
            {t.badge && (
              <div className="absolute -top-3 right-6 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 shadow-gold">
                {t.badge}
              </div>
            )}
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.tag}</div>
            <div className="mt-2 font-display text-2xl">{t.name}</div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-4xl">{t.price}</span>
              {t.priceNote && <span className="text-xs text-muted-foreground">{t.priceNote}</span>}
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
            <ul className="mt-6 space-y-2.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className={`h-4 w-4 mt-0.5 shrink-0 ${t.highlight ? "text-primary" : "text-primary/70"}`} />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <PrimaryCta
                label={t.cta.label}
                href={t.cta.href}
                tone={t.cta.tone}
                trackName={t.cta.track}
                icon={ArrowRight}
              />
            </div>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
        Trading CFDs carries risk. Vantage is an independent regulated broker; PrintEzy earns partner rebates on live
        accounts opened through our link, at no extra cost to you.
      </p>
    </Section>
  );
}

// ============== PARTNER JOURNEY ==============
function PartnerJourney() {
  const steps = [
    { n: 1, t: "Open Vantage account", d: "Click our partner link. Standard account, 3-min form." },
    { n: 2, t: "Verify KYC", d: "Upload ID + proof of address inside Vantage's secure portal." },
    { n: 3, t: "Fund your account", d: "Any amount to start. We recommend a size you're comfortable losing." },
    { n: 4, t: "Send us your account #", d: "DM PrintEzy Support — we tag your account to the partner program." },
    { n: 5, t: "Unlock EzyMap Pro", d: "Full software + private partner channel activated within 24h." },
    { n: 6, t: "Trade the plan", d: "Onboarding call with PrintEzy Support, ongoing reviews with Jack." },
  ];
  return (
    <Section
      id="partner"
      eyebrow="Partner journey"
      title={<>From signup to <span className="text-gradient-gold">first mapped trade</span> — in 24 hours.</>}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((s) => (
          <div key={s.n} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent font-bold">
                {s.n}
              </div>
              <div className="font-display text-lg">{s.t}</div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <PrimaryCta
          label="Start Partner Signup"
          href={LINKS.vantage}
          tone="gold"
          trackName="partner_start"
          icon={ArrowUpRight}
        />
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        We never ask for your password, OTP, or bank details. All funds stay in your Vantage account.
      </p>
    </Section>
  );
}

// ============== EDUCATION ==============
function Education() {
  const cards = [
    { icon: BookOpen, t: "Ebooks", d: "Structured PDFs on price action, risk, and psychology.", href: "#ebooks", track: "edu_ebooks" },
    { icon: LineChart, t: "Weekly Analysis", d: "Deep dives on Gold, FX, and BTC before session open.", href: LINKS.channel, track: "edu_analysis" },
    { icon: Target, t: "Trade Reviews", d: "Winners and losers broken down with what to repeat and what to cut.", href: LINKS.channel, track: "edu_reviews" },
    { icon: MessageCircle, t: "Community Q&A", d: "Ask any question. Get answered by Jack or the partner desk.", href: LINKS.support, track: "edu_qa" },
  ];
  return (
    <Section
      id="education"
      eyebrow="Education ecosystem"
      title={<>Learn the <span className="text-gradient-green">why</span>, not just the entry.</>}
      intro="EzyMap does the mapping. Our education stack teaches you the reasoning behind every zone, entry, and exit — so you build a real edge, not a dependency."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <a
            key={c.t}
            href={c.href}
            rel="noopener noreferrer"
            onClick={() => track("click", c.track)}
            className="glass-card rounded-2xl p-6 group hover:border-primary/30 transition-colors"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-5 font-display text-lg">{c.t}</div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-xs text-primary group-hover:gap-2 transition-all">
              Explore <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}

// ============== EBOOK LIBRARY ==============
function EbookLibrary() {
  const books = [
    { t: "Technical Analysis", sub: "20-page foundation", status: "Available", href: LINKS.ebook, track: "ebook_ta" },
    { t: "Mapping Like a Pro", sub: "Advanced EzyMap workflow", status: "Available", href: LINKS.ebook, track: "ebook_map" },
    { t: "The Small Account Playbook", sub: "Grow $500 to $5K responsibly", status: "Coming soon", href: "#", track: "ebook_small" },
  ];
  return (
    <Section
      id="ebooks"
      eyebrow="Ebook library"
      title={<>Books that <span className="text-gradient-gold">actually change</span> how you trade.</>}
    >
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div className="relative grid grid-cols-2 gap-5">
          <div aria-hidden className="absolute -inset-8 rounded-[3rem] opacity-40 blur-3xl pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-green transition-transform hover:-translate-y-1">
            <img src={EBOOK_COVERS.technicalAnalysis} alt="PrintEzy Technical Analysis ebook cover" loading="lazy" className="w-full h-auto" />
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-green transition-transform hover:-translate-y-1 mt-8">
            <img src={EBOOK_COVERS.mappingLikePro} alt="Mapping Like A Pro ebook cover" loading="lazy" className="w-full h-auto" />
          </div>
        </div>

        <div className="space-y-4">
          {books.map((b) => {
            const disabled = b.status === "Coming soon";
            return (
              <a
                key={b.t}
                href={disabled ? "#ebooks" : b.href}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (disabled) {
                    e.preventDefault();
                    return;
                  }
                  track("click", b.track);
                }}
                className={`flex items-center justify-between gap-4 rounded-2xl border p-5 transition-all ${
                  disabled
                    ? "border-white/5 bg-white/[0.02] cursor-not-allowed"
                    : "border-white/8 bg-white/[0.02] hover:border-primary/30 hover:bg-white/[0.04]"
                }`}
              >
                <div className="min-w-0">
                  <div className="font-display text-lg truncate">{b.t}</div>
                  <div className="text-sm text-muted-foreground truncate">{b.sub}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${disabled ? "bg-white/5 text-muted-foreground" : "bg-primary/15 text-primary"}`}>
                    {b.status}
                  </span>
                  {!disabled && <ArrowRight className="h-4 w-4 text-primary" />}
                </div>
              </a>
            );
          })}
          <p className="text-xs text-muted-foreground">
            All ebooks delivered instantly via Telegram. No signup, no email spam.
          </p>
        </div>
      </div>
    </Section>
  );
}

// ============== JACK BRAND ==============
function JackBrand() {
  return (
    <section id="jack" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10">
        <img src={jackSilhouette.url} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover object-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.25em] text-primary/90">Who runs PrintEzy</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight">
            The trader is anonymous.<br />
            <span className="text-gradient-gold">The results are not.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Jack has traded Gold, FX, and crypto for over a decade — full-time, private, no ego, no gurus.
            PrintEzy exists because the tools that work at his desk shouldn't stay locked behind a $2,000
            course. PrintEzy Support runs partnerships and onboarding. That's the whole team.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryCta label="Read Weekly Analysis" href={LINKS.channel} tone="ghost" trackName="jack_channel" icon={LineChart} />
            <PrimaryCta label="DM PrintEzy Support" href={LINKS.support} tone="gold" trackName="jack_support" icon={MessageCircle} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ============== RESULTS GALLERY ==============
type ResultCase = {
  id: string;
  asset: "Gold" | "BTC";
  outcome: "Win" | "Loss" | "Invalidated" | "No Entry";
  title: string;
  rr: string;
  date: string;
  note: string;
  img: string;
};
const CASES: ResultCase[] = [
  { id: "1", asset: "Gold", outcome: "Win", title: "Intraday M30 buy live", rr: "Live", date: "23 Jul", note: "Low-risk buy zone, EMA + Fibonacci confluence. LIVE alert fired at 4,131.90.", img: CHARTS.goldIntradayLive },
  { id: "2", asset: "Gold", outcome: "Loss", title: "M1 scalp sell — micro stop", rr: "-2 pips", date: "23 Jul", note: "High-risk zone rejection, plan hit stop on wick. Sized small, damage minimal.", img: CHARTS.goldScalpLive },
  { id: "3", asset: "Gold", outcome: "No Entry", title: "Scalp sell ready", rr: "Ready", date: "23 Jul", note: "Sell zone mapped at 4,130 — waiting for price to tap. Discipline > FOMO.", img: CHARTS.goldScalpReady },
  { id: "4", asset: "Gold", outcome: "No Entry", title: "4H swing sell setup", rr: "Ready", date: "23 Jul", note: "Bearish bias, sell entry zone mapped above 4,128. Plan waits for the market.", img: CHARTS.goldSwingReady },
  { id: "5", asset: "BTC", outcome: "No Entry", title: "4H swing buy setup", rr: "Ready", date: "23 Jul", note: "Bearish short-term bias, low-risk buy zone mapped below 65,600. Ready state.", img: CHARTS.btcSwingReady },
  { id: "6", asset: "BTC", outcome: "Loss", title: "M1 scalp buy — tight stop", rr: "-8 pips", date: "23 Jul", note: "Entry zone rejection with CHoCH confluence. Stop hit on retest. Same map, next print.", img: CHARTS.btcScalpLive },
];

const FILTERS: Array<ResultCase["asset"] | ResultCase["outcome"] | "All"> = ["All", "Gold", "BTC", "Win", "Loss", "Invalidated", "No Entry"];

function ResultsGallery() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const visible = CASES.filter((c) => filter === "All" || c.asset === filter || c.outcome === filter);
  return (
    <Section
      id="results"
      eyebrow="Transparent results"
      title={<>Wins. Losses. <span className="text-gradient-green">No-entries too.</span></>}
      intro="We publish the misses along with the winners. A trading system that only shows greens is a marketing funnel, not an edge."
    >
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              track("click", `results_filter_${f}`);
            }}
            className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors ${
              filter === f ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {visible.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl p-4 flex flex-col"
            >
              <div className="relative overflow-hidden rounded-xl border border-white/5 bg-black">
                <img
                  src={c.img}
                  alt={`${c.asset} ${c.title}`}
                  loading="lazy"
                  className="w-full h-56 object-contain mx-auto"
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-full bg-white/5 text-muted-foreground">{c.asset}</span>
                <span
                  className={`px-2 py-1 rounded-full font-semibold ${
                    c.outcome === "Win"
                      ? "bg-primary/15 text-primary"
                      : c.outcome === "Loss"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {c.outcome}
                </span>
              </div>
              <div className="mt-3 font-display text-lg">{c.title}</div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">{c.rr}</span>
                <span>·</span>
                <span>{c.date}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.note}</p>
            </motion.div>

          ))}
        </AnimatePresence>
      </div>
      <p className="mt-8 text-xs text-muted-foreground text-center max-w-2xl mx-auto">
        Historical setups are shown for education. Past performance does not indicate future results. Trade at your own risk.
      </p>
    </Section>
  );
}

// ============== TELEGRAM COMMUNITY ==============
function IPhoneMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Ambient green glow */}
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[3.5rem] blur-2xl opacity-60 -z-10"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, hsl(var(--primary) / 0.35), transparent 70%)" }}
      />
      {/* Device frame */}
      <div
        className="relative rounded-[2.75rem] p-[10px] shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #2a2a2a 0%, #0a0a0a 45%, #1a1a1a 100%)",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px hsl(var(--primary) / 0.25)",
        }}
      >
        {/* Side buttons */}
        <span aria-hidden className="absolute left-[-3px] top-[110px] h-8 w-[3px] rounded-l bg-neutral-800" />
        <span aria-hidden className="absolute left-[-3px] top-[160px] h-14 w-[3px] rounded-l bg-neutral-800" />
        <span aria-hidden className="absolute left-[-3px] top-[220px] h-14 w-[3px] rounded-l bg-neutral-800" />
        <span aria-hidden className="absolute right-[-3px] top-[170px] h-20 w-[3px] rounded-r bg-neutral-800" />

        {/* Inner bezel */}
        <div className="relative rounded-[2.25rem] overflow-hidden bg-black">
          {/* Dynamic Island */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 top-2 z-20 h-[26px] w-[95px] rounded-full bg-black"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}
          >
            <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-neutral-800 ring-1 ring-neutral-700" />
          </div>
          {/* Screen */}
          <img src={src} alt={alt} loading="lazy" className="block w-full h-auto" />
          {/* Subtle screen sheen */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.06) 0%, transparent 30%, transparent 70%, rgba(16,185,129,0.05) 100%)" }}
          />
        </div>
      </div>
      {/* Floating tech accents */}
      <div aria-hidden className="pointer-events-none absolute -top-3 -right-3 h-14 w-14 rounded-full border border-primary/30 opacity-60" />
      <div aria-hidden className="pointer-events-none absolute -bottom-4 -left-4 h-10 w-10 rounded-full border border-[hsl(var(--gold))]/30 opacity-60" />
    </div>
  );
}

function TelegramCommunity() {
  return (
    <Section
      id="telegram"
      eyebrow="Community"
      title={<>Ten thousand traders. <span className="text-gradient-green">One Telegram.</span></>}
      intro="Daily maps, live commentary, and real conversations. No spam, no scam DMs — a moderated space for traders who take this seriously."
    >
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
        <div className="order-2 lg:order-1 space-y-4">
          {[
            { t: "10,000+ members", d: "And growing weekly, organically." },
            { t: "Moderated 24/7", d: "Support and the team keep the noise out." },
            { t: "Daily bias posts", d: "Pre-Asia, pre-London, pre-New York." },
            { t: "Zero paid signals", d: "Everything is transparent. Nothing hidden." },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">{f.t}</div>
                <div className="text-sm text-muted-foreground">{f.d}</div>
              </div>
            </div>
          ))}
          <div className="pt-4">
            <PrimaryCta label="Join Telegram Channel" href={LINKS.channel} tone="green" trackName="telegram_join" icon={ArrowUpRight} />
          </div>
        </div>
        <div className="order-1 lg:order-2 relative flex justify-center">
          <div aria-hidden className="absolute inset-0 blur-3xl opacity-40 -z-10" style={{ background: "var(--gradient-glow)" }} />
          <IPhoneMockup src={telegramPhone.url} alt="PrintEzy Telegram channel on mobile" />
        </div>
      </div>
    </Section>
  );
}

// ============== FAQ ==============
const FAQS = [
  { q: "What is EzyMap?", a: "EzyMap is a TradingView-based mapping system that plots supply and demand zones and gives you READY / LIVE signals across scalping, intraday, and swing timeframes." },
  { q: "Is EzyMap a signal service?", a: "No. It's a workflow. You still make the final decision on every trade. We give you the map, the bias, and the alert — you decide if it fits your plan." },
  { q: "Do I need Vantage to use EzyMap?", a: "Only for the Pro Partner tier. Lite is free on Telegram, and Pro Software works on any broker you connect to TradingView." },
  { q: "How much does the software cost?", a: "$29/month or $69 lifetime. Free when you open a live account through our Vantage partner link." },
  { q: "Do you take my broker password?", a: "Never. We never ask for passwords, OTPs, or banking details. All funds stay in your own broker account." },
  { q: "What markets do you cover?", a: "Primary: Gold (XAUUSD) and BTC. Also FX majors and select indices in the private channel." },
  { q: "What timeframes work best?", a: "All three modes are supported. Busy pros love Swing, day traders use Intraday, active desks use Scalping." },
  { q: "Do you guarantee profits?", a: "No — and anyone who does is lying. Trading involves substantial risk. Our job is to give you a repeatable process, not a guaranteed outcome." },
  { q: "Who is Jack?", a: "A private full-time trader with over a decade in Gold, FX, and crypto. Faceless by choice — the process speaks louder than the personality." },
  
  { q: "Is this course-based?", a: "No. There's no locked video library. Education is delivered continuously via ebooks, weekly analysis, and live channel breakdowns." },
  { q: "How do I get the ebooks?", a: "Free on Telegram. No email, no funnel, no upsell." },
  { q: "Can I cancel Pro Software?", a: "Yes. Monthly is cancel-anytime. Lifetime is a one-off." },
  { q: "Is there a refund policy?", a: "Software: 7-day refund if the indicator doesn't install on your TradingView. Partner tier: free, so no refund needed." },
  { q: "What if I'm a total beginner?", a: "Start with the free ebook + Lite channel for two weeks. Once the workflow clicks, upgrade." },
  { q: "How much time do I need daily?", a: "Swing mode: 10–15 minutes. Intraday: 30–60 minutes around session open. Scalping: full attention during your session." },
  { q: "What broker do you recommend?", a: "Vantage (our partner) — regulated, tight spreads, TradingView integration. Any decent broker works for the software though." },
  { q: "Do you offer live sessions?", a: "Weekly recap and pre-session bias in the private partner channel. No fluffy webinars." },
  { q: "How are alerts delivered?", a: "TradingView push notifications, browser, and Telegram forwards inside the private channel." },
  { q: "Can I use my own strategy alongside?", a: "Absolutely. Many users combine EzyMap zones with their own confluence." },
  { q: "Where are you based?", a: "The team operates across Southeast Asia. Vantage handles regulation and custody." },
  { q: "How do I contact support?", a: "Direct-message PrintEzy Support on Telegram. Real human, usually within a few hours." },
];

// ============== TESTIMONIALS ==============
const TESTIMONIALS = [
  {
    initials: "BD",
    name: "Budi D.",
    role: "Software Engineer · Side trader",
    quote:
      "The free ebook alone clarified more than three months of YouTube tutorials. Jack keeps me sharp without burning my evenings.",
  },
  {
    initials: "PR",
    name: "Priya R.",
    role: "Full-time Trader",
    quote:
      "Jack's analysis is the first thing I read before the New York open. The bias calls are scary accurate and the risk framing feels institutional-grade.",
  },
  {
    initials: "LR",
    name: "Luqman R.",
    role: "Consultant · Father of two",
    quote:
      "I only have 20 minutes a day for markets and PrintEzy fits that life. I'm finally green for the year without being glued to a screen.",
  },
];

function Testimonials() {
  return (
    <Section
      id="testimonials"
      eyebrow="Traders talking"
      title={<>Real results from <span className="text-gradient-green">real traders</span>.</>}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-7 backdrop-blur-sm hover:border-primary/30 transition-colors"
          >
            <div className="flex gap-1 text-accent" aria-label="5 star rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 text-sm sm:text-base text-foreground/90 leading-relaxed">
              "{t.quote}"
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-white/5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                {t.initials}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

function Faq() {
  return (
    <Section id="faq" eyebrow="Answers" title={<>Frequently asked, <span className="text-gradient-green">honestly answered</span>.</>}>
      <div className="max-w-3xl mx-auto divide-y divide-white/5 rounded-2xl border border-white/8 bg-white/[0.02]">
        {FAQS.map((f, i) => (
          <details key={i} className="group px-5 py-4 open:bg-white/[0.02]">
            <summary
              className="flex items-center justify-between cursor-pointer list-none gap-4"
              onClick={() => track("click", `faq_${i}`)}
            >
              <span className="font-medium text-foreground">{f.q}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

// ============== FINAL CTA ==============
function FinalCta() {
  return (
    <section id="final" className="relative py-24 sm:py-32 overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-hero" />
      <div aria-hidden className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-glow)" }} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3.5 py-1.5 text-xs text-accent">
          <Crown className="h-3.5 w-3.5" /> Your next session, mapped
        </div>
        <h2 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight">
          Stop guessing.<br />
          <span className="text-gradient-gold">Start printing.</span>
        </h2>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Pick your entry point. Free channel today, Pro software tomorrow, or unlock everything as a Vantage partner.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <PrimaryCta label="Open Vantage Account" href={LINKS.vantage} tone="green" trackName="final_open" icon={ArrowUpRight} />
          <PrimaryCta label="Get EzyMap Lite Free" href={LINKS.ezymapLite} tone="ghost" trackName="final_lite" icon={Sparkles} />
          <PrimaryCta label="Chat With PrintEzy Support" href={LINKS.support} tone="gold" trackName="final_support" icon={MessageCircle} />
        </div>
      </div>
    </section>
  );
}

// ============== FOOTER ==============
function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/80 pt-16 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <img src={logo.url} alt="PrintEzy" className="h-10 w-auto" />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              PrintEzy is a trading education and analytics ecosystem. Map it. Plan it. Print it.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Product</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#ezymap" className="hover:text-primary">EzyMap</a></li>
              <li><a href="#ladder" className="hover:text-primary">Pricing</a></li>
              <li><a href="#ebooks" className="hover:text-primary">Ebooks</a></li>
              <li><a href="#results" className="hover:text-primary">Results</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Community</div>
            <ul className="space-y-2 text-sm">
              <li><a href={LINKS.channel} rel="noopener noreferrer" className="hover:text-primary">Telegram</a></li>
              <li><a href={LINKS.support} rel="noopener noreferrer" className="hover:text-primary">DM PrintEzy Support</a></li>
              <li><a href={LINKS.vantage} rel="noopener noreferrer" className="hover:text-primary">Open Vantage Account</a></li>
              <li><a href="#faq" className="hover:text-primary">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 text-xs text-muted-foreground space-y-3">
          <p>
            <strong className="text-foreground/80">Risk disclosure.</strong> Trading foreign exchange, commodities, and
            cryptocurrencies carries a high level of risk and may not be suitable for all investors. Leverage can work
            for and against you. Before deciding to trade, carefully consider your objectives, experience, and risk
            appetite. Past performance is not indicative of future results.
          </p>
          <p>
            PrintEzy provides education and analytics only. We are not a financial advisor, broker, or fund manager.
            PrintEzy earns partner rebates on live accounts opened through our Vantage partner link at no additional
            cost to you. Nothing on this site constitutes financial advice.
          </p>
          <p>© {new Date().getFullYear()} PrintEzy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ============== FLOATING MOBILE CTA ==============
function FloatingCta() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 inset-x-4 z-40 sm:hidden"
        >
          <a
            href={LINKS.ezymapLite}
            rel="noopener noreferrer"
            onClick={() => track("click", "floating_lite")}
            className="flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-semibold shadow-green"
          >
            <Sparkles className="h-4 w-4" /> Get EzyMap Lite Free
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============== ROOT ==============
export function Landing() {
  useEffect(() => {
    trackPageLoad();
    const cleanup = trackSectionVisibility([
      "top",
      "problem",
      "ezymap",
      "how",
      "demo",
      "ladder",
      "partner",
      "education",
      "ebooks",
      "jack",
      "results",
      "telegram",
      "testimonials",
      "faq",
      "final",
    ]);
    return cleanup;
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <TrustBar />
        <Problem />
        <EzyMapIntro />
        <HowItWorks />
        <WorkflowDemo />
        <ProductLadder />
        <PartnerJourney />
        <Education />
        <EbookLibrary />
        <JackBrand />
        <ResultsGallery />
        <TelegramCommunity />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <FloatingCta />
    </div>
  );
}
