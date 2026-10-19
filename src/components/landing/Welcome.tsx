import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BellRing,
  BrainCircuit,
  ChevronDown,
  Crosshair,
  Layers,
  Send,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { getActiveMemberCount } from "@/lib/member-count.functions";
import { useCountUp } from "@/lib/use-count-up";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { goTrack, trackEngagement, trackPageLoad } from "@/lib/analytics";
import { brandLogo, LINKS } from "./Landing";

/**
 * The first page a visitor sees. One job: get them into the free Telegram
 * channel, or failing that, onto the full site. Every section below the hero
 * ends in one of those two doors so a scroll never dead-ends.
 */

const FIND_OUT_MORE = "/home";
const FALLBACK_MEMBERS = 640;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function JoinButton({ where, size = "lg", label = "Join the free channel" }: { where: string; size?: "lg" | "md"; label?: string }) {
  const pad = size === "lg" ? "px-8 py-4 text-base" : "px-5 py-2.5 text-sm";
  return (
    <a
      href={LINKS.freeChannel}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => goTrack(`welcome_join_${where}`)}
      className={`group relative inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-primary ${pad} font-bold text-primary-foreground shadow-[0_0_0_0_rgba(47,191,113,0.6)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_0_40px_6px_rgba(47,191,113,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-safe:hover:-translate-y-0.5`}
    >
      <Send className="h-[1.1em] w-[1.1em]" aria-hidden="true" />
      {label}
      <ArrowRight className="h-[1.1em] w-[1.1em] transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </a>
  );
}

function MoreButton({ where, size = "lg", label = "Find out more" }: { where: string; size?: "lg" | "md"; label?: string }) {
  const pad = size === "lg" ? "px-8 py-4 text-base" : "px-5 py-2.5 text-sm";
  return (
    <Link
      to={FIND_OUT_MORE}
      onClick={() => goTrack(`welcome_more_${where}`)}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.03] ${pad} font-semibold text-foreground backdrop-blur transition-colors duration-200 hover:border-accent/60 hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`}
    >
      {label}
    </Link>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary">{children}</p>;
}

/* ------------------------------------------------------------------ */
/* Hero visual: a Telegram-style alert feed                            */
/* ------------------------------------------------------------------ */

function AlertCard({ pair, side, lines, time, className = "" }: { pair: string; side: "BUY" | "SELL"; lines: [string, string][]; time: string; className?: string }) {
  const up = side === "BUY";
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#101413]/90 p-4 shadow-2xl backdrop-blur ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${up ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>{side}</span>
          <span className="font-display text-base font-bold text-foreground">{pair}</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">{time}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[12.5px]">
        {lines.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="tabular-nums text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="absolute -inset-10 -z-10 rounded-full bg-primary/20 blur-3xl motion-safe:animate-pulse" />
      <div className="absolute -right-6 -top-8 -z-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-body">Live in the channel · sample</span>
      </div>
      <div className="space-y-3">
        <AlertCard pair="XAUUSD" side="BUY" time="now" lines={[["Entry", "2,341.50"], ["Stop", "2,336.20"], ["TP1", "2,349.00"], ["TP2", "2,358.40"]]} className="motion-safe:animate-[float_6s_ease-in-out_infinite]" />
        <AlertCard pair="BTCUSD" side="SELL" time="12m" lines={[["Entry", "67,420"], ["Stop", "68,150"], ["TP1", "66,300"], ["TP2", "65,100"]]} className="ml-6 opacity-80" />
        <AlertCard pair="EURUSD" side="BUY" time="38m" lines={[["Entry", "1.0842"], ["Stop", "1.0811"], ["TP1", "1.0890"], ["TP2", "1.0936"]]} className="mr-6 opacity-50" />
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">Illustrative sample, not a live trade.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Hero({ members }: { members: number }) {
  const count = useCountUp(members);
  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_30%,rgba(47,191,113,0.20),transparent_70%),radial-gradient(40%_40%_at_10%_90%,rgba(201,161,58,0.12),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_70%_at_50%_30%,black,transparent)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pb-28 lg:pt-20">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Free on Telegram · {count}+ traders inside
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
            className="mt-6 font-display text-[44px] font-bold leading-[0.95] tracking-tight text-foreground [text-wrap:balance] sm:text-6xl lg:text-7xl"
          >
            Never miss a <span className="bg-gradient-to-r from-primary to-[#7be3a8] bg-clip-text text-transparent">setup</span> again.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-body sm:text-xl"
          >
            The trade forms while you are at work, asleep or in the gym. Our alerts hit your phone the moment it does, with the entry, the stop, the targets and the reason, so you act instead of watching charts all day.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <JoinButton where="hero" />
            <MoreButton where="hero" />
          </motion.div>
          <p className="mt-4 text-sm text-muted-foreground">Free to join · no card · leave any time</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2, ease: EASE }}>
          <HeroVisual />
        </motion.div>
      </div>
      <a href="#pain" aria-label="Scroll to learn more" className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-muted-foreground transition-colors hover:text-foreground lg:block">
        <ChevronDown className="h-6 w-6 motion-safe:animate-bounce" aria-hidden="true" />
      </a>
    </section>
  );
}

const MARKETS = ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY", "NAS100", "US30", "ETHUSD", "USOIL", "AUDUSD"];

function MarketStrip() {
  const items = [...MARKETS, ...MARKETS];
  return (
    <div className="border-y border-border bg-surface/60" aria-label="Markets covered">
      <div className="ticker-wrap mx-auto max-w-6xl overflow-hidden py-3">
        <div className="ticker-track animate-ticker gap-10 font-mono text-sm text-body" aria-hidden="true">
          {items.map((m, i) => (
            <span key={`${m}-${i}`} className="shrink-0">
              <span className="mr-2 text-primary">◆</span>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const PAINS = [
  { icon: Crosshair, title: "You saw it too late", body: "The clean entry printed an hour ago. Now you are staring at a candle that already ran and wondering if you should chase." },
  { icon: Layers, title: "Too many charts, too much noise", body: "Ten indicators, three timeframes, a dozen opinions. Everything disagrees, so you freeze or you gamble." },
  { icon: ShieldAlert, title: "No plan once you are in", body: "Where does the stop go? When do you take profit? Without levels written down first, emotions make the call." },
];

function Pain() {
  return (
    <section id="pain" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-24 sm:px-8">
      <Reveal className="max-w-2xl">
        <Eyebrow>Sound familiar?</Eyebrow>
        <h2 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight [text-wrap:balance] sm:text-5xl">Trading alone is a full-time job nobody pays you for.</h2>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PAINS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.1}>
            <div className="h-full rounded-2xl border border-border bg-gradient-to-b from-surface-elevated to-surface p-6 transition-colors hover:border-accent/40">
              <p.icon className="h-7 w-7 text-accent" aria-hidden="true" />
              <h3 className="mt-5 font-display text-xl font-bold">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-body">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Join the free channel", body: "One tap opens Telegram. No sign-up form, no card." },
  { n: "02", title: "Get the alert", body: "When a setup forms, your phone buzzes with the full plan: entry, stop, targets, why." },
  { n: "03", title: "Act on your terms", body: "Take it, skip it, or study it. Daily education shows you the reasoning so you grow." },
];

function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight [text-wrap:balance] sm:text-5xl">Three steps. Under a minute.</h2>
        </Reveal>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 0.1} className="h-full">
                <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-background p-7">
                  <span className="absolute -right-2 -top-4 font-display text-8xl font-bold text-white/[0.04]" aria-hidden="true">{s.n}</span>
                  <span className="font-mono text-sm font-bold text-primary">{s.n}</span>
                  <h3 className="mt-3 font-display text-2xl font-bold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-body">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
        <Reveal className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <JoinButton where="steps" />
          <MoreButton where="steps" />
        </Reveal>
      </div>
    </section>
  );
}

const ANATOMY = [
  { k: "Entry", v: "Where to get in, and the zone it is valid for." },
  { k: "Stop", v: "Where the idea is wrong. Risk is defined before you click." },
  { k: "Targets", v: "TP1 and TP2, so you know what you are aiming for." },
  { k: "The why", v: "The confluence behind it, so you learn the setup, not just copy it." },
];

function Anatomy() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2">
      <Reveal>
        <Eyebrow>Inside every alert</Eyebrow>
        <h2 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight [text-wrap:balance] sm:text-5xl">A complete trade plan, not a vague hint.</h2>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-body">Most signal groups shout a ticker and a direction. Ours hands you the whole plan, so you always know your risk before you act.</p>
        <ul className="mt-8 space-y-4">
          {ANATOMY.map((a) => (
            <li key={a.k} className="flex gap-4">
              <BellRing className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-body"><strong className="text-foreground">{a.k}.</strong> {a.v}</p>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mx-auto max-w-sm rounded-[2rem] border border-white/10 bg-[#0d100f] p-3 shadow-[0_30px_80px_-20px_rgba(47,191,113,0.25)]">
          <div className="rounded-[1.5rem] bg-[#121615] p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-3">
              <img src={brandLogo} alt="" width={36} height={36} className="h-9 w-9 rounded-full bg-black object-contain" />
              <div>
                <p className="text-sm font-bold">EzyMap ALGO</p>
                <p className="text-xs text-muted-foreground">channel · sample alert</p>
              </div>
            </div>
            <AlertCard pair="XAUUSD" side="BUY" time="09:42" lines={[["Entry", "2,341.50"], ["Stop", "2,336.20"], ["TP1", "2,349.00"], ["TP2", "2,358.40"]]} />
            <p className="mt-3 rounded-xl bg-white/[0.04] p-3 text-[13px] leading-relaxed text-body">Why: trend and momentum agree, price is reacting off a key level, risk is tight. If 2,336 breaks, the idea is dead.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const CHAT: { who: "you" | "bot"; text: string }[] = [
  { who: "you", text: "Is gold worth buying right now?" },
  { who: "bot", text: "XAUUSD: trend up on H4, momentum rising, price near support. Confluence is building but wait for the retest of 2,338 before entering." },
  { who: "you", text: "Alert me when it gets there." },
  { who: "bot", text: "Done. Watch set on XAUUSD 2,338. I will message you the moment it triggers." },
];

function EzyAi() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(CHAT.length);

  useEffect(() => {
    if (reduced || !ref.current) return;
    setShown(0);
    let timer: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let n = 0;
        timer = setInterval(() => {
          n += 1;
          setShown(n);
          if (n >= CHAT.length) clearInterval(timer);
        }, 1100);
      },
      { threshold: 0.4 },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [reduced]);

  return (
    <section className="border-y border-border bg-gradient-to-b from-surface/50 to-background">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2">
        <Reveal className="lg:order-2">
          <Eyebrow>Meet EzyAI</Eyebrow>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight [text-wrap:balance] sm:text-5xl">Your own analyst, inside Telegram.</h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-body">Ask about any market in plain English. EzyAI reads the technicals, sets watch alerts and tells you when confluence lines up. Free to start.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={LINKS.ezyai}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => goTrack("welcome_ezyai")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-6 py-3 font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <BrainCircuit className="h-5 w-5" aria-hidden="true" />
              Try EzyAI free
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="lg:order-1">
          <div ref={ref} className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#101413] p-4 shadow-2xl" role="img" aria-label="Sample chat: a trader asks EzyAI about gold and sets a price alert.">
            <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold">
              <BrainCircuit className="h-5 w-5 text-accent" aria-hidden="true" /> EzyAI
              <span className="ml-auto text-xs font-normal text-primary">● online</span>
            </div>
            <div className="min-h-[19rem] space-y-3" aria-hidden="true">
              {CHAT.slice(0, shown).map((m, i) => (
                <motion.div
                  key={i}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${m.who === "you" ? "ml-auto rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-white/[0.06] text-body"}`}
                >
                  {m.text}
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const TIERS = [
  { name: "Free", tag: "Start here", body: "Live channel alerts and daily education. Costs nothing.", hot: true },
  { name: "Pro", tag: "Go deeper", body: "More of the toolkit for traders who want an edge.", hot: false },
  { name: "Premium", tag: "Serious", body: "Advanced tools and tighter support for full-time focus.", hot: false },
  { name: "Elite", tag: "All in", body: "The complete EzyMap stack, everything unlocked.", hot: false },
];

function Tiers() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Reveal className="max-w-2xl">
        <Eyebrow>Your path</Eyebrow>
        <h2 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight [text-wrap:balance] sm:text-5xl">Start free. Grow only if it earns it.</h2>
        <p className="mt-4 text-lg text-body">Most members begin in the free channel. Upgrade later, if and when you want more.</p>
      </Reveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.08}>
            <div className={`h-full rounded-2xl border p-6 ${t.hot ? "border-primary/60 bg-primary/[0.07] shadow-[0_0_50px_-12px_rgba(47,191,113,0.5)]" : "border-border bg-surface"}`}>
              <p className={`font-mono text-xs uppercase tracking-widest ${t.hot ? "text-primary" : "text-accent"}`}>{t.tag}</p>
              <h3 className="mt-2 font-display text-2xl font-bold">{t.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">{t.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-8">
        <Link to="/home" hash="packages" onClick={() => goTrack("welcome_compare_plans")} className="inline-flex items-center gap-2 font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          Compare the plans <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Reveal>
    </section>
  );
}

const FAQ = [
  { q: "Is the channel really free?", a: "Yes. Joining the Telegram channel costs nothing and needs no card. Paid plans exist for people who want more, but they are never required." },
  { q: "Do I need trading experience?", a: "No. Alerts come with the reasoning, and the daily education is written so a beginner can follow it while experienced traders still find the levels useful." },
  { q: "Which markets do you cover?", a: "Forex, gold, crypto and major indices, such as XAUUSD, BTCUSD and EURUSD." },
  { q: "Are signals guaranteed to win?", a: "No. Nobody can promise that, and anyone who does should be avoided. Every trade can lose. That is why each alert comes with a stop and a defined risk." },
  { q: "Can I leave any time?", a: "Yes. Leave or mute the channel whenever you like. There is nothing to cancel." },
];

function Faq() {
  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
        <Reveal>
          <Eyebrow>Quick answers</Eyebrow>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Before you join</h2>
        </Reveal>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-background">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5 open:bg-white/[0.02]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-2 leading-relaxed text-body">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ members }: { members: number }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(47,191,113,0.28),transparent_70%),radial-gradient(40%_50%_at_80%_0%,rgba(201,161,58,0.15),transparent_70%)]" />
      <Reveal className="mx-auto max-w-3xl px-5 py-28 text-center sm:px-8">
        <h2 className="font-display text-5xl font-bold leading-[0.98] tracking-tight [text-wrap:balance] sm:text-6xl">The next setup is forming right now.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-body">Join {members}+ traders already inside. It takes one tap, and you can leave any time.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <JoinButton where="final" />
          <MoreButton where="final" />
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <strong className="text-body">Risk warning:</strong> Trading forex, crypto and CFDs carries a high level of risk and may not be suitable for everyone. You can lose some or all of your capital. Signals and education are general information, not financial advice, and past performance does not guarantee future results. Only trade money you can afford to lose.
        </p>
        <nav aria-label="Footer" className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-body">
          <Link to="/home" className="hover:text-foreground">Full site</Link>
          <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
        </nav>
        <p className="mt-5 text-xs text-muted-foreground">© {new Date().getFullYear()} EzyMap ALGO</p>
      </div>
    </footer>
  );
}

/** Thin top bar plus a bottom bar that appears once the hero scrolls away. */
function Bars() {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold" aria-label="EzyMap ALGO home">
            <img src={brandLogo} alt="" width={32} height={32} className="h-8 w-8 rounded-full bg-black object-contain" />
            EzyMap <span className="text-primary">ALGO</span>
          </Link>
          <div className="hidden items-center gap-5 sm:flex">
            <Link to={FIND_OUT_MORE} onClick={() => goTrack("welcome_more_nav")} className="text-sm font-semibold text-body hover:text-foreground">Full site</Link>
            <JoinButton where="nav" size="md" label="Join free" />
          </div>
        </div>
      </header>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 sm:hidden ${past ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <JoinButton where="sticky" size="md" label="Join free channel" />
          <MoreButton where="sticky" size="md" label="More" />
        </div>
      </div>
    </>
  );
}

export function Welcome() {
  const [members, setMembers] = useState(FALLBACK_MEMBERS);
  const getMembers = useServerFn(getActiveMemberCount);

  useEffect(() => {
    void getMembers({ data: undefined })
      .then(setMembers)
      .catch(() => {
        /* keep the fallback; the count must never block the page */
      });
    trackPageLoad("welcome");
    const stop = trackEngagement();
    return () => stop?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Bars />
      <main>
        <Hero members={members} />
        <MarketStrip />
        <Pain />
        <HowItWorks />
        <Anatomy />
        <EzyAi />
        <Tiers />
        <Faq />
        <FinalCta members={members} />
      </main>
      <Footer />
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  );
}
