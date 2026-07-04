import { motion } from "framer-motion";
import { BookOpen, LineChart, ArrowRight, Sparkles, Shield, Zap, Clock, Star, DollarSign, Euro, Bitcoin, TrendingUp, BarChart3, CandlestickChart, Smile, PartyPopper, Flame, Timer, Download, CheckCircle2, FileText } from "lucide-react";
import logo from "@/assets/printezy-logo-transparent.png.asset.json";
import telegramLogo from "@/assets/telegram-3d.png.asset.json";
import trader from "@/assets/hero-trader.png.asset.json";
import ebookCover from "@/assets/ebook-cover.jpg.asset.json";

const EBOOK_URL = "https://t.me/printezydollar/2154";

const CTAS = [
  {
    label: "FREE EBOOK",
    sub: "Traders' playbook, MC to grow",
    icon: BookOpen,
    href: "#ebook",
    tone: "gold" as const,
  },
  {
    label: "PRO ANALYSIS",
    sub: "Pro tools for precise analysis",
    icon: LineChart,
    href: "https://www.tradingview.com/pricing/?share_your_love=printezyusd",
    tone: "green" as const,
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
        large ? "min-w-[260px]" : "w-full"
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

function TelegramAskButton() {
  return (
    <motion.a
      href="https://t.me/m/JrLzPcStOTc9"
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -4 }}
      whileTap={{ y: -1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="group relative inline-flex shrink-0 items-center gap-2 self-center overflow-hidden rounded-xl bg-green px-3 py-2 text-left text-primary-foreground shadow-green transition-shadow hover:shadow-[0_18px_50px_-12px_oklch(0.72_0.20_150/0.6)] sm:self-stretch"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/20">
        <img
          src={telegramLogo.url}
          alt="Telegram"
          className="h-4 w-4 object-contain"
          loading="lazy"
          width={512}
          height={512}
        />
      </span>
      <span className="text-[10px] font-bold tracking-[0.12em] font-display whitespace-nowrap">ASK ME ANYTHING</span>
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </motion.a>
  );
}

function LogoMark({ className = "h-14 w-auto" }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="PrintEzy logo"
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
}

function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-full border border-border/60 bg-background/60 px-3 py-2 backdrop-blur-xl md:px-5">
        <a href="#top" className="flex items-center gap-3">
          <LogoMark className="h-16 w-auto" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">PrintEzy</span>
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

/* ---------- Background decorations ---------- */

function FintechBackdrop() {
  // Subtle transparent fintech elements: candlesticks, mini chart, ticker lines
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.12]">
      <CandlestickChart className="absolute top-[12%] left-[6%] h-24 w-24 text-accent" strokeWidth={1} />
      <BarChart3 className="absolute bottom-[18%] right-[8%] h-28 w-28 text-primary" strokeWidth={1} />
      <TrendingUp className="absolute top-[40%] right-[14%] h-16 w-16 text-accent" strokeWidth={1} />
      <LineChart className="absolute bottom-[35%] left-[10%] h-20 w-20 text-primary" strokeWidth={1} />
      <svg className="absolute inset-x-0 top-1/3 w-full opacity-50" height="60" viewBox="0 0 600 60" preserveAspectRatio="none">
        <path d="M0 40 L60 30 L120 45 L180 20 L240 35 L300 15 L360 30 L420 10 L480 25 L540 8 L600 22" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1" />
      </svg>
    </div>
  );
}

function CurrencyBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]">
      <DollarSign className="absolute top-[8%] left-[5%] h-32 w-32 text-accent" strokeWidth={1.2} />
      <Euro className="absolute top-[20%] right-[10%] h-24 w-24 text-primary" strokeWidth={1.2} />
      <Bitcoin className="absolute bottom-[15%] left-[12%] h-28 w-28 text-accent" strokeWidth={1.2} />
      <DollarSign className="absolute bottom-[30%] right-[18%] h-20 w-20 text-primary" strokeWidth={1.2} />
      <Euro className="absolute top-[55%] left-[40%] h-16 w-16 text-accent" strokeWidth={1.2} />
      <Bitcoin className="absolute top-[5%] right-[35%] h-14 w-14 text-primary" strokeWidth={1.2} />
    </div>
  );
}

function EmojiBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08]">
      <Smile className="absolute top-[10%] left-[8%] h-20 w-20 text-accent" strokeWidth={1.3} />
      <PartyPopper className="absolute top-[25%] right-[12%] h-24 w-24 text-primary" strokeWidth={1.3} />
      <Smile className="absolute bottom-[18%] left-[15%] h-16 w-16 text-primary" strokeWidth={1.3} />
      <PartyPopper className="absolute bottom-[30%] right-[8%] h-20 w-20 text-accent" strokeWidth={1.3} />
      <Smile className="absolute top-[55%] left-[45%] h-14 w-14 text-accent" strokeWidth={1.3} />
    </div>
  );
}

function UrgencyBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.1]">
      <Flame className="absolute top-[10%] left-[6%] h-20 w-20 text-accent" strokeWidth={1.3} />
      <Timer className="absolute top-[30%] right-[10%] h-24 w-24 text-primary" strokeWidth={1.3} />
      <Flame className="absolute bottom-[15%] right-[15%] h-16 w-16 text-accent" strokeWidth={1.3} />
      <Timer className="absolute bottom-[25%] left-[12%] h-20 w-20 text-primary" strokeWidth={1.3} />
    </div>
  );
}

/* ---------- Hero ---------- */

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-hero">
      <div className="absolute -top-32 -left-24 h-[420px] w-[420px] animate-float-slow rounded-full opacity-70 blur-3xl" style={{ background: "var(--gradient-glow)" }} />
      <div className="absolute -top-10 right-[-120px] h-[380px] w-[380px] animate-float-slower rounded-full opacity-60 blur-3xl" style={{ background: "var(--gradient-gold-glow)" }} />
      <div className="absolute bottom-[-160px] left-1/3 h-[460px] w-[460px] animate-float-slow rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-glow)" }} />
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.10_0.015_155)_100%)]" />
    </div>
  );
}

function HeroTraderBg() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[55%] overflow-hidden"
    >
      {/* Green 3D glow halos */}
      <div className="absolute inset-0 -z-10 scale-110 rounded-full blur-3xl opacity-60" style={{ background: "radial-gradient(circle at 50% 55%, oklch(0.72 0.22 150 / 0.45), transparent 60%)" }} />
      <div className="absolute inset-0 -z-10 scale-125 rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle at 50% 70%, oklch(0.85 0.16 88 / 0.25), transparent 65%)" }} />

      <img
        src={trader.url}
        alt="A professional trader overlooking the city — PrintEzy"
        className="absolute right-0 top-1/2 h-[85%] w-auto max-w-none -translate-y-1/2 select-none object-contain object-right"
        style={{
          filter:
            "drop-shadow(0 0 28px oklch(0.72 0.22 150 / 0.55)) drop-shadow(0 18px 36px oklch(0.10 0.015 155 / 0.8))",
          transform: "translateY(-50%) perspective(1200px) rotateY(-4deg)",
        }}
        draggable={false}
      />

      {/* Gradient overlay so text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />

      {/* Floating fintech accents */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="glass-card absolute right-[12%] top-[22%] hidden items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold shadow-elevated sm:flex"
      >
        <TrendingUp className="h-4 w-4 text-accent" strokeWidth={2.5} />
        <span className="text-foreground">XAU/USD +2.4%</span>
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="glass-card absolute right-[8%] bottom-[26%] hidden items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold shadow-elevated sm:flex"
      >
        <CandlestickChart className="h-4 w-4 text-primary" strokeWidth={2.5} />
        <span className="text-foreground">Live setup</span>
      </motion.div>
    </motion.div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center pt-28 pb-20">
      <HeroBackdrop />
      <HeroTraderBg />
      <FintechBackdrop />
      <div className="relative mx-auto w-full max-w-6xl px-5">
        <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Built for traders who hate wasting time
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Meet <span className="text-gradient-gold">Jack</span>.
              <br />
              Your edge in <span className="text-gradient-green">the markets</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg lg:mx-0 mx-auto">
              Clear, no-fluff trading resources for newcomers, full-time pros, and busy professionals who want results without screen-staring all day.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="mt-8 flex flex-col gap-3 sm:flex-row max-w-md mx-auto lg:max-w-3xl lg:mx-0"
            >
              {CTAS.map((c) => (
                <CtaButton key={c.label} cta={c} />
              ))}
              <TelegramAskButton />
            </motion.div>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-xs text-muted-foreground">
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: BookOpen, title: "Beginner-friendly playbooks", body: "Breakdowns of setups, risk, and psychology. Start from zero and ship your first trade with confidence." },
  { icon: LineChart, title: "Pro-level market analysis", body: "Weekly deep dives on gold, FX, and crypto. Bias, key levels, and the trade plan sent before the session opens." },
  { icon: Zap, title: "Live signals channel", body: "Curated entries with stop, target, and rationale. No spam 10-20 pips pings, only setups worth your screen time." },
  { icon: Clock, title: "Designed for busy professionals", body: "Mobile-first formats. Build a real trading edge around a full-time career." },
  { icon: Shield, title: "Risk-first by default", body: "Always focus on lot sizing and capital preservation. Compound, don't gamble." },
  { icon: Sparkles, title: "Always free, always sharp", body: "Free premium ebook, analysis, channel, built to actually move your P&L." },
];

function Features() {
  return (
    <section id="features" className="relative px-5 py-24 md:py-32">
      <CurrencyBackdrop />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-bold tracking-[0.22em] text-accent">/ WHAT YOU GET</p>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">
            A complete edge, <span className="text-gradient-gold">on the house</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            3 free pillars built to take newbie to pro without selling you a course.
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
    name: "Budi D.",
    role: "Software Engineer · Side trader",
    quote: "The free ebook alone clarified more than 3 months of YouTube. Jack keeps me sharp without burning my evenings.",
    initials: "BD",
  },
  {
    name: "Priya R.",
    role: "Full-time Trader",
    quote: "Jack's analysis is the first thing I read before New York open. The bias calls are scary accurate and the risk framing is institutional-grade.",
    initials: "PR",
  },
  {
    name: "Luqman R.",
    role: "Consultant · Father of two",
    quote: "I have 20 minutes a day for markets. PrintEzy fits that life. I'm finally green for the year and not glued to a screen.",
    initials: "LR",
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="relative px-5 py-24 md:py-32">
      <div className="absolute inset-x-0 top-1/2 h-[400px] -translate-y-1/2 opacity-40" style={{ background: "var(--gradient-glow)" }} />
      <EmojiBackdrop />
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
        <UrgencyBackdrop />
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full opacity-60 blur-3xl" style={{ background: "var(--gradient-gold-glow)" }} />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ background: "var(--gradient-glow)" }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <div className="relative text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />
            Limited spots this week
          </div>
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Pick your <span className="text-gradient-gold">free starter</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            No cards, no commitments. Just the tools traders actually use.
          </p>
        </div>

        <div className="relative mx-auto mt-10 flex flex-col gap-3 sm:flex-row max-w-4xl">
          {CTAS.map((c) => (
            <CtaButton key={c.label} cta={c} />
          ))}
          <TelegramAskButton />
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
          <LogoMark className="h-12 w-auto" />
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
