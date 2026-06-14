import { motion } from "framer-motion";
import { BookOpen, LineChart, Send, ArrowRight, Sparkles, Shield, Zap, Clock, Star } from "lucide-react";

const CTAS = [
  {
    label: "FREE EBOOK",
    sub: "The trader's playbook — zero to confident",
    icon: BookOpen,
    href: "https://t.me/printezydollar/2154",
    tone: "gold" as const,
  },
  {
    label: "FREE ANALYSIS",
    sub: "Pro market read delivered to you",
    icon: LineChart,
    href: "https://www.tradingview.com/pricing/?share_your_love=printezyusd",
    tone: "green" as const,
  },
  {
    label: "FREE CHANNEL",
    sub: "Live signals + setups, no noise",
    icon: Send,
    href: "https://t.me/printezydollar",
    tone: "gold" as const,
  },
];

function CtaButton({ cta, large = false }: { cta: (typeof CTAS)[number]; large?: boolean }) {
  const Icon = cta.icon;
  const isGold = cta.tone === "gold";
  return (
    <motion.a
      href={cta.href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -4 }}
      whileTap={{ y: -1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 text-left transition-shadow ${
        large ? "min-w-[260px]" : "w-full sm:w-auto"
      } ${
        isGold
          ? "bg-gold text-accent-foreground shadow-gold hover:shadow-[0_18px_50px_-12px_oklch(0.85_0.16_88/0.6)]"
          : "bg-green text-primary-foreground shadow-green hover:shadow-[0_18px_50px_-12px_oklch(0.72_0.20_150/0.6)]"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          isGold ? "bg-black/15" : "bg-black/20"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold tracking-[0.14em] font-display">{cta.label}</span>
        <span className="block text-xs opacity-80 mt-0.5">{cta.sub}</span>
      </span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </motion.a>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-full border border-border/60 bg-background/60 px-4 py-2.5 backdrop-blur-xl md:px-6">
        <a href="#top" className="flex items-center gap-2 font-display text-base font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold shadow-gold">
            <Sparkles className="h-4 w-4 text-accent-foreground" strokeWidth={2.5} />
          </span>
          <span>
            Print<span className="text-gradient-gold">Ezy</span>
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
        </nav>
        <a
          href="#cta"
          className="rounded-full bg-gold px-4 py-1.5 text-xs font-bold tracking-wider text-accent-foreground shadow-gold"
        >
          GET STARTED
        </a>
      </div>
    </header>
  );
}

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-hero">
      {/* Floating orbs */}
      <div className="absolute -top-32 -left-24 h-[420px] w-[420px] animate-float-slow rounded-full opacity-70 blur-3xl" style={{ background: "var(--gradient-glow)" }} />
      <div className="absolute -top-10 right-[-120px] h-[380px] w-[380px] animate-float-slower rounded-full opacity-60 blur-3xl" style={{ background: "var(--gradient-gold-glow)" }} />
      <div className="absolute bottom-[-160px] left-1/3 h-[460px] w-[460px] animate-float-slow rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-glow)" }} />

      {/* Perspective grid floor */}
      <div
        className="absolute bottom-0 left-1/2 h-[55%] w-[180%] -translate-x-1/2 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.68 0.18 155 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.80 0.14 88 / 0.25) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "perspective(700px) rotateX(60deg) translateZ(0)",
          transformOrigin: "center top",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 90%)",
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.10_0.015_155)_100%)]" />
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center pt-28 pb-20">
      <HeroBackdrop />
      <div className="relative mx-auto w-full max-w-6xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Built for traders who hate wasting time
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Meet <span className="text-gradient-gold">Jack</span>.
            <br />
            Your edge in <span className="text-gradient-green">the markets</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            Clear, no-fluff trading resources for newcomers, full-time pros, and busy professionals who want results without screen-staring all day.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-3"
        >
          {CTAS.map((c) => (
            <CtaButton key={c.label} cta={c} />
          ))}
        </motion.div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-foreground">10k+</span> active traders
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="font-display text-lg font-bold text-foreground">4.9</span> average rating
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-foreground">$0</span> to start
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: BookOpen, title: "Beginner-friendly playbooks", body: "Plain-English breakdowns of setups, risk, and psychology. Start from zero and ship your first trade with confidence." },
  { icon: LineChart, title: "Pro-level market analysis", body: "Weekly deep dives on FX, indices, and crypto. Bias, key levels, and the trade plan — sent before the session opens." },
  { icon: Zap, title: "Live signals channel", body: "Curated entries with stop, target, and rationale. No spam pings — only setups worth your screen time." },
  { icon: Clock, title: "Designed for busy professionals", body: "10-minute briefs, mobile-first formats. Build a real trading edge around a full-time career." },
  { icon: Shield, title: "Risk-first by default", body: "Every resource centers position sizing and capital preservation. Compound, don't gamble." },
  { icon: Sparkles, title: "Always free, always sharp", body: "Three free pillars — ebook, analysis, channel — built to actually move your P&L." },
];

function Features() {
  return (
    <section id="features" className="relative px-5 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-bold tracking-[0.22em] text-accent">/ WHAT YOU GET</p>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">
            A complete edge, <span className="text-gradient-gold">on the house</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three free pillars built to take you from clueless to consistent — without selling you a course.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ y: -6 }}
                className="glass-card group relative overflow-hidden rounded-3xl p-6 shadow-elevated"
              >
                <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: "var(--gradient-gold-glow)" }} />
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold shadow-gold">
                    <Icon className="h-5 w-5 text-accent-foreground" strokeWidth={2.4} />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    role: "Software Engineer · Side trader",
    quote: "The free ebook alone clarified more in two hours than three months of YouTube. The channel keeps me sharp without burning my evenings.",
    initials: "MT",
  },
  {
    name: "Priya R.",
    role: "Full-time Trader",
    quote: "Jack's analysis is the first thing I read before London open. The bias calls are scary accurate and the risk framing is institutional-grade.",
    initials: "PR",
  },
  {
    name: "David K.",
    role: "Consultant · Father of two",
    quote: "I have 20 minutes a day for markets. PrintEzy fits that life. I'm finally green for the year — and not glued to a screen.",
    initials: "DK",
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="relative px-5 py-24 md:py-32">
      <div className="absolute inset-x-0 top-1/2 h-[400px] -translate-y-1/2 opacity-40" style={{ background: "var(--gradient-glow)" }} />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-bold tracking-[0.22em] text-accent">/ TRADERS TALKING</p>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">
            Real results from <span className="text-gradient-green">real traders</span>.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass-card flex flex-col gap-5 rounded-3xl p-6 shadow-elevated"
            >
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-foreground/90">"{t.quote}"</blockquote>
              <figcaption className="flex items-center gap-3 pt-2 border-t border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green font-display text-sm font-bold text-primary-foreground">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="cta" className="relative px-5 py-20 md:py-28">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-accent/25 p-8 shadow-elevated md:p-14" style={{ background: "linear-gradient(135deg, oklch(0.22 0.04 155) 0%, oklch(0.14 0.02 155) 100%)" }}>
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full opacity-60 blur-3xl" style={{ background: "var(--gradient-gold-glow)" }} />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ background: "var(--gradient-glow)" }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <div className="relative text-center">
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Pick your <span className="text-gradient-gold">free starter</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            No cards, no commitments. Just the tools traders actually use.
          </p>
        </div>

        <div className="relative mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
          {CTAS.map((c) => (
            <CtaButton key={c.label} cta={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2 font-display font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={2.5} />
          </span>
          Print<span className="text-gradient-gold">Ezy</span>
        </div>
        <p>© {new Date().getFullYear()} PrintEzy. Trade responsibly. Not financial advice.</p>
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
