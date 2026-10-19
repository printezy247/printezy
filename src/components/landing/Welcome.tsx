import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ArrowUp,
  BellRing,
  BrainCircuit,
  ChevronDown,
  Crosshair,
  Layers,
  Send,
  ShieldAlert,
} from "lucide-react";
import { getActiveMemberCount } from "@/lib/member-count.functions";
import { useCountUp } from "@/lib/use-count-up";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { goTrack, trackEngagement, trackPageLoad } from "@/lib/analytics";
import markImg from "@/assets/ezymap-mark.webp";
import { LINKS } from "./Landing";

/**
 * The first page a visitor sees. Direct-response layout: light page, one bold
 * promise, one big green button repeated down the page, a quiet black
 * disclaimer footer. Every section ends in one of two doors: the free Telegram
 * channel, or the full site.
 */

function Mark({ size, className = "" }: { size: number; className?: string }) {
  return (
    <img
      src={markImg}
      width={size}
      height={size}
      alt=""
      decoding="async"
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

const FIND_OUT_MORE = "/home";
const FALLBACK_MEMBERS = 640;
const GREEN = "bg-[#3ddc84] hover:bg-[#2fcf77] text-neutral-950";

/** Shown in server HTML and without JS; only hidden after mount, below the fold. */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setHidden(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHidden(false);
        io.disconnect();
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-700 ease-out ${hidden ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"}`}
      style={{ transitionDelay: hidden ? "0ms" : `${delay * 1000}ms` }}
    >
      {children}
    </div>
  );
}

function JoinButton({
  where,
  wide = false,
  label = "Join the free channel",
}: {
  where: string;
  wide?: boolean;
  label?: string;
}) {
  return (
    <a
      href={LINKS.freeChannel}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => goTrack(`welcome_join_${where}`)}
      className={`group relative inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-sm px-8 py-4 text-lg font-extrabold uppercase tracking-wide shadow-[0_6px_0_0_#1fa55e] transition-all duration-150 hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#1fa55e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 ${GREEN} ${wide ? "w-full" : ""}`}
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-white/40 motion-safe:animate-[shine_3.6s_ease-in-out_infinite] motion-reduce:hidden"
        aria-hidden="true"
      />
      <Send className="h-5 w-5" aria-hidden="true" />
      {label}
      <ArrowRight
        className="h-5 w-5 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      />
    </a>
  );
}

function MoreLink({
  where,
  label = "Find out more",
  dark = false,
}: {
  where: string;
  label?: string;
  dark?: boolean;
}) {
  return (
    <Link
      to={FIND_OUT_MORE}
      onClick={() => goTrack(`welcome_more_${where}`)}
      className={`inline-flex min-h-12 items-center justify-center rounded-sm border-2 px-7 py-3 text-base font-bold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 ${dark ? "border-white/70 text-white hover:bg-white hover:text-neutral-950" : "border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white"}`}
    >
      {label}
    </Link>
  );
}

function CtaPair({ where, center = true }: { where: string; center?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row ${center ? "items-center justify-center" : ""}`}
    >
      <JoinButton where={where} />
      <MoreLink where={where} />
    </div>
  );
}

function Heading({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl font-extrabold leading-[1.08] tracking-tight text-neutral-950 [text-wrap:balance] sm:text-4xl lg:text-5xl">
        {children}
      </h2>
      {sub ? (
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-neutral-600">{sub}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phone mock                                                          */
/* ------------------------------------------------------------------ */

function AlertCard({
  pair,
  side,
  lines,
  time,
}: {
  pair: string;
  side: "BUY" | "SELL";
  lines: [string, string][];
  time: string;
}) {
  const up = side === "BUY";
  return (
    <div className="rounded-xl border border-white/10 bg-[#171c1a] p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${up ? "bg-[#3ddc84]/15 text-[#3ddc84]" : "bg-amber-400/15 text-amber-300"}`}
          >
            {side}
          </span>
          <span className="text-[15px] font-bold text-white">{pair}</span>
        </div>
        <span className="font-mono text-[11px] text-neutral-400">{time}</span>
      </div>
      <dl className="mt-2.5 grid grid-cols-4 gap-2 font-mono text-[11.5px]">
        {lines.map(([k, v]) => (
          <div key={k}>
            <dt className="text-neutral-400">{k}</dt>
            <dd className="mt-0.5 tabular-nums text-neutral-100">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Phone({
  children,
  caption,
  peek = false,
}: {
  children: ReactNode;
  caption: string;
  peek?: boolean;
}) {
  return (
    <figure className="mx-auto w-full max-w-[300px]">
      <div
        className={`rounded-[2.2rem] border-[7px] border-neutral-900 bg-neutral-900 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] ${peek ? "max-h-[300px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_62%,transparent)] lg:max-h-none lg:[mask-image:none]" : ""}`}
      >
        <div className="rounded-[1.7rem] bg-[#0f1311] p-3">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-neutral-700" aria-hidden="true" />
          <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-2.5">
            <Mark size={32} />
            <div>
              <p className="text-[13px] font-bold text-white">EzyMap ALGO</p>
              <p className="text-[11px] text-neutral-400">channel</p>
            </div>
          </div>
          <div className="space-y-2.5">{children}</div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-neutral-500">{caption}</figcaption>
    </figure>
  );
}

type Sample = {
  pair: string;
  side: "BUY" | "SELL";
  lines: [string, string][];
};

/** Illustrative only. Never presented as live trades. */
const SAMPLES: Sample[] = [
  {
    pair: "XAUUSD",
    side: "BUY",
    lines: [
      ["Entry", "2,341.5"],
      ["Stop", "2,336.2"],
      ["TP1", "2,349.0"],
      ["TP2", "2,358.4"],
    ],
  },
  {
    pair: "BTCUSD",
    side: "SELL",
    lines: [
      ["Entry", "67,420"],
      ["Stop", "68,150"],
      ["TP1", "66,300"],
      ["TP2", "65,100"],
    ],
  },
  {
    pair: "EURUSD",
    side: "BUY",
    lines: [
      ["Entry", "1.0842"],
      ["Stop", "1.0811"],
      ["TP1", "1.0890"],
      ["TP2", "1.0936"],
    ],
  },
  {
    pair: "US30",
    side: "SELL",
    lines: [
      ["Entry", "39,860"],
      ["Stop", "40,020"],
      ["TP1", "39,640"],
      ["TP2", "39,420"],
    ],
  },
  {
    pair: "GBPJPY",
    side: "BUY",
    lines: [
      ["Entry", "191.45"],
      ["Stop", "190.92"],
      ["TP1", "192.10"],
      ["TP2", "192.80"],
    ],
  },
];

const FEED_AGES = ["now", "3m", "11m"];

/** Newest alert slides in on top every few seconds. Static without motion or JS. */
function useSampleFeed(reduced: boolean) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1);
    }, 3600);
    return () => clearInterval(id);
  }, [reduced]);
  const n = SAMPLES.length;
  return FEED_AGES.map((age, j) => ({
    key: tick - j,
    age,
    ...SAMPLES[(((tick - j) % n) + n) % n],
  }));
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Hero({ members }: { members: number }) {
  const count = useCountUp(members);
  const reduced = usePrefersReducedMotion();
  const feed = useSampleFeed(reduced);
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-8 pt-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:pb-20 lg:pt-16">
        <div className="text-center lg:text-left">
          <p
            className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 font-mono text-xs font-bold text-neutral-700 lg:mx-0"
            aria-hidden="true"
          >
            <span className="h-2 w-2 rounded-full bg-[#1fa55e] motion-safe:animate-pulse" />
            SAMPLE ALERT · {feed[0].pair} {feed[0].side} · now
          </p>
          <h1 className="text-[40px] font-extrabold leading-[1.04] tracking-tight text-neutral-950 [text-wrap:balance] sm:text-6xl lg:text-[64px]">
            Never Miss A Trade Setup <span className="whitespace-nowrap">Again.</span>
          </h1>
          <p className="mt-4 text-[13px] font-extrabold uppercase tracking-wide text-red-600 sm:mt-5 sm:text-xl">
            *** Free to join · No card · Leave any time ***
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-700 sm:mt-5 sm:text-lg lg:mx-0">
            Live trading alerts land on your phone the moment a setup forms, with the entry, stop,
            targets and the reason. No more watching charts all day.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center sm:gap-4 lg:justify-start">
            <JoinButton where="hero" />
            <MoreLink where="hero" />
          </div>
          <p className="mt-5 text-sm font-semibold text-neutral-600">
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full bg-[#1fa55e] motion-safe:animate-pulse"
              aria-hidden="true"
            />
            {count}+ traders inside · opens Telegram in one tap
          </p>
          <p className="mt-1.5 text-xs text-neutral-600">
            Trading carries risk. Alerts are information, not financial advice.
          </p>
        </div>
        <Phone peek caption="Illustrative sample alerts, not live trades.">
          <div className="space-y-2.5">
            {feed.map((f) => (
              <div
                key={f.key}
                className={f.age === "now" ? "motion-safe:animate-[fadeUp_0.5s_ease-out]" : ""}
              >
                <AlertCard pair={f.pair} side={f.side} time={f.age} lines={f.lines} />
              </div>
            ))}
          </div>
        </Phone>
      </div>
    </section>
  );
}

const FACTS = ["Forex", "Gold", "Crypto", "Indices", "Daily education", "AI analyst"];

function FactStrip() {
  return (
    <div className="border-y border-neutral-200 bg-neutral-50" aria-label="What is covered">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-5 py-4 text-sm font-bold uppercase tracking-wide text-neutral-700">
        {FACTS.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-[#1fa55e]" aria-hidden="true">
              ✔
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

const PAINS = [
  {
    icon: Crosshair,
    title: "You saw it too late",
    body: "Gold ran 40 pips while you slept. The clean entry printed hours ago and now you are deciding whether to chase.",
  },
  {
    icon: Layers,
    title: "Too much noise",
    body: "Ten indicators, three timeframes, a dozen opinions. Everything disagrees, so you freeze or you gamble.",
  },
  {
    icon: ShieldAlert,
    title: "No plan once you are in",
    body: "Where does the stop go? Without levels set first, emotion makes the call.",
  },
];

function Pain() {
  return (
    <section className="bg-white px-5 py-12 sm:px-8 sm:py-16">
      <Reveal>
        <Heading>Trading alone is a full-time job nobody pays you for.</Heading>
      </Reveal>
      <div className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-3 md:gap-6">
        {PAINS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.1}>
            <div className="h-full rounded-lg border-2 border-neutral-900 bg-white p-5 shadow-[5px_5px_0_0_#171717]">
              <div className="flex items-center gap-3">
                <p.icon className="h-7 w-7 shrink-0 text-red-600" aria-hidden="true" />
                <h3 className="text-lg font-extrabold text-neutral-950">{p.title}</h3>
              </div>
              <p className="mt-2 leading-relaxed text-neutral-700">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "1",
    title: "Join the free channel",
    body: "One tap opens Telegram. No sign-up form, no card.",
  },
  {
    n: "2",
    title: "Get the alert",
    body: "When a setup forms your phone buzzes with the full plan.",
  },
  {
    n: "3",
    title: "Act on your terms",
    body: "Take it, skip it, or study it. Daily education shows the reasoning.",
  },
];

const ANATOMY = [
  { k: "Entry", v: "Where to get in, and the zone it is valid for." },
  { k: "Stop", v: "Where the idea is wrong. Risk is defined before you click." },
  { k: "Targets", v: "TP1 and TP2, so you know what you are aiming for." },
  { k: "The why", v: "The confluence behind it, so you learn the setup, not just copy it." },
];

function HowItWorks() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50 px-5 py-12 sm:px-8 sm:py-16">
      <Reveal>
        <Heading sub="Under a minute to start.">Three steps. Then the alerts come to you.</Heading>
      </Reveal>
      <ol className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-3 md:gap-8">
        {STEPS.map((s, i) => (
          <li key={s.n}>
            <Reveal delay={i * 0.1} className="flex gap-4 text-left md:block md:text-center">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-neutral-950 text-xl font-extrabold text-[#3ddc84] md:mx-auto md:h-14 md:w-14 md:text-2xl">
                {s.n}
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-neutral-950 md:mt-4 md:text-xl">
                  {s.title}
                </h3>
                <p className="mt-1 leading-relaxed text-neutral-700 md:mt-2">{s.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-12 grid max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <Reveal>
          <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-neutral-950 [text-wrap:balance] sm:text-3xl">
            A complete trade plan, not a vague hint.
          </h3>
          <ul className="mt-5 space-y-3">
            {ANATOMY.map((a) => (
              <li key={a.k} className="flex gap-3">
                <BellRing className="mt-1 h-5 w-5 shrink-0 text-[#12803f]" aria-hidden="true" />
                <p className="text-neutral-700">
                  <strong className="text-neutral-950">{a.k}.</strong> {a.v}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mx-auto w-full max-w-sm space-y-2.5 rounded-2xl bg-[#0f1311] p-4 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.5)]">
            <AlertCard
              pair="XAUUSD"
              side="BUY"
              time="09:42"
              lines={[
                ["Entry", "2,341.5"],
                ["Stop", "2,336.2"],
                ["TP1", "2,349.0"],
                ["TP2", "2,358.4"],
              ]}
            />
            <p className="rounded-xl bg-white/[0.05] p-3 text-[12.5px] leading-relaxed text-neutral-300">
              Why: trend and momentum agree, price is reacting off a key level, risk is tight. If
              2,336 breaks, the idea is dead.
            </p>
            <p className="text-center text-xs text-neutral-400">Illustrative sample alert.</p>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-10">
        <CtaPair where="steps" />
      </Reveal>
    </section>
  );
}

type Testimonial = { quote: string; name: string; role?: string };
/** Real member quotes only, with permission. Empty means the section is not rendered. */
const TESTIMONIALS: Testimonial[] = [];

function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="bg-white px-5 py-12 sm:px-8 sm:py-16">
      <Reveal>
        <Heading>What members say</Heading>
      </Reveal>
      <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3 md:gap-6">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1}>
            <figure className="h-full rounded-lg border-2 border-neutral-900 bg-white p-5 shadow-[5px_5px_0_0_#171717]">
              <blockquote className="leading-relaxed text-neutral-800">“{t.quote}”</blockquote>
              <figcaption className="mt-3 text-sm font-bold text-neutral-950">
                {t.name}
                {t.role ? <span className="font-normal text-neutral-600"> · {t.role}</span> : null}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const CHAT: { who: "you" | "bot"; text: string }[] = [
  { who: "you", text: "Is gold worth buying right now?" },
  {
    who: "bot",
    text: "XAUUSD: trend up on H4, momentum rising, price near support. Confluence is building but wait for the retest of 2,338 before entering.",
  },
  { who: "you", text: "Alert me when it gets there." },
  {
    who: "bot",
    text: "Done. Watch set on XAUUSD 2,338. I will message you the moment it triggers.",
  },
];

function EzyAi() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(CHAT.length);

  useEffect(() => {
    if (reduced || !ref.current || typeof IntersectionObserver === "undefined") return;
    if (ref.current.getBoundingClientRect().top < window.innerHeight) return;
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
    <section className="border-y border-neutral-200 bg-neutral-50 px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <Reveal className="lg:order-2">
          <h2 className="text-3xl font-extrabold leading-[1.08] tracking-tight text-neutral-950 [text-wrap:balance] sm:text-4xl lg:text-5xl">
            Your own AI analyst, inside Telegram.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-700">
            Ask about any market in plain English. EzyAI reads the technicals, sets watch alerts and
            tells you when confluence lines up. Free to start.
          </p>
          <a
            href={LINKS.ezyai}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => goTrack("welcome_ezyai")}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-neutral-950 px-7 py-3 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            <BrainCircuit className="h-5 w-5 text-[#3ddc84]" aria-hidden="true" />
            Try EzyAI free
          </a>
        </Reveal>
        <Reveal delay={0.1} className="lg:order-1">
          <div
            ref={ref}
            className="mx-auto max-w-md rounded-xl border-2 border-neutral-900 bg-white p-4 shadow-[8px_8px_0_0_#171717]"
            role="img"
            aria-label="Sample chat: a trader asks EzyAI about gold and sets a price alert."
          >
            <div className="mb-3 flex items-center gap-2 border-b border-neutral-200 pb-3 text-sm font-extrabold text-neutral-950">
              <BrainCircuit className="h-5 w-5 text-[#1fa55e]" aria-hidden="true" /> EzyAI
              <span className="ml-auto text-xs font-semibold text-[#12803f]">● online</span>
            </div>
            <div className="min-h-[19rem] space-y-3" aria-hidden="true">
              {CHAT.slice(0, shown).map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed motion-safe:animate-[fadeUp_0.4s_ease-out] ${m.who === "you" ? "ml-auto rounded-br-sm bg-[#3ddc84] text-neutral-950" : "rounded-bl-sm bg-neutral-100 text-neutral-800"}`}
                >
                  {m.text}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "Is the channel really free?",
    a: "Yes. Joining the Telegram channel costs nothing and needs no card. Paid plans exist for people who want more, but they are never required.",
  },
  {
    q: "Do I need trading experience?",
    a: "No. Alerts come with the reasoning, and the daily education is written so a beginner can follow it while experienced traders still find the levels useful.",
  },
  {
    q: "Which markets do you cover?",
    a: "Forex, gold, crypto and major indices, such as XAUUSD, BTCUSD and EURUSD.",
  },
  {
    q: "Are signals guaranteed to win?",
    a: "No. Nobody can promise that, and anyone who does should be avoided. Every trade can lose. That is why each alert comes with a stop and a defined risk.",
  },
  {
    q: "Can I leave any time?",
    a: "Yes. Leave or mute the channel whenever you like. There is nothing to cancel.",
  },
];

function Faq() {
  return (
    <section className="bg-white px-5 py-12 sm:px-8 sm:py-16">
      <Reveal>
        <Heading>Before you join</Heading>
      </Reveal>
      <div className="mx-auto mt-8 max-w-3xl divide-y-2 divide-neutral-900 border-y-2 border-neutral-900">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold text-neutral-950 focus-visible:outline-2 focus-visible:outline-neutral-900 [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown
                className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="pb-4 leading-relaxed text-neutral-700">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ members }: { members: number }) {
  return (
    <section className="bg-[#3ddc84] px-5 py-12 text-center sm:px-8 sm:py-16">
      <Reveal className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-extrabold leading-[1.05] tracking-tight text-neutral-950 [text-wrap:balance] sm:text-5xl">
          The next setup is forming right now.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg font-semibold text-neutral-900">
          Join {members}+ traders already inside. One tap, and you can leave any time.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={LINKS.freeChannel}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => goTrack("welcome_join_final")}
            className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-sm bg-neutral-950 px-8 py-4 text-lg font-extrabold uppercase tracking-wide text-white shadow-[0_6px_0_0_#000] transition-all hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#000] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
          >
            <Send className="h-5 w-5 text-[#3ddc84]" aria-hidden="true" />
            Join the free channel
            <ArrowRight
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>
          <MoreLink where="final" />
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  const reduced = usePrefersReducedMotion();
  return (
    <footer className="bg-black px-5 py-12 text-neutral-400 sm:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <Mark size={40} className="mx-auto mb-4" />
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={LINKS.freeChannel}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => goTrack("welcome_join_footer")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-sm px-5 py-2 text-sm font-extrabold uppercase tracking-wide focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${GREEN}`}
          >
            <Send className="h-4 w-4" aria-hidden="true" /> Join the free channel
          </a>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border-2 border-white/60 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white hover:bg-white hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" /> Back to top
          </button>
        </div>
        <p className="text-xs leading-relaxed">
          <strong className="text-neutral-200">Risk warning:</strong> Trading forex, crypto and CFDs
          carries a high level of risk and may not be suitable for everyone. You can lose some or
          all of your capital. Signals and education are general information, not financial advice,
          and past performance does not guarantee future results. Only trade money you can afford to
          lose.
        </p>
        <nav
          aria-label="Footer"
          className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm"
        >
          <Link to="/home" className="hover:text-white">
            Full site
          </Link>
          <Link to="/faq" className="hover:text-white">
            FAQ
          </Link>
          <Link to="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-white">
            Terms
          </Link>
        </nav>
        <p className="mt-5 text-xs">
          © {new Date().getFullYear()} EzyMap ALGO. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function Bars() {
  const [past, setPast] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      setPast(window.scrollY > 300);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) {
        bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div
          ref={bar}
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[#3ddc84]"
          style={{ transform: "scaleX(0)" }}
          aria-hidden="true"
        />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight text-neutral-950"
            aria-label="EzyMap ALGO home"
          >
            <Mark size={36} />
            EzyMap <span className="text-[#12803f]">ALGO</span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
            <Link
              to={FIND_OUT_MORE}
              onClick={() => goTrack("welcome_more_nav")}
              className="text-sm font-bold uppercase tracking-wide text-neutral-800 hover:text-neutral-950"
            >
              Full site
            </Link>
            <a
              href={LINKS.freeChannel}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => goTrack("welcome_join_nav")}
              className={`inline-flex min-h-11 items-center gap-2 rounded-sm px-5 py-2 text-sm font-extrabold uppercase tracking-wide ${GREEN}`}
            >
              Join free
            </a>
          </nav>
        </div>
      </header>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] transition-transform duration-300 sm:hidden ${past ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <a
            href={LINKS.freeChannel}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => goTrack("welcome_join_sticky")}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-4 py-3 text-sm font-extrabold uppercase tracking-wide ${GREEN}`}
          >
            <Send className="h-4 w-4" aria-hidden="true" /> Join free channel
          </a>
          <MoreLink where="sticky" label="More" />
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
    <div className="min-h-screen bg-white text-neutral-900">
      <Bars />
      <main>
        <Hero members={members} />
        <FactStrip />
        <Pain />
        <HowItWorks />
        <EzyAi />
        <Testimonials />
        <Faq />
        <FinalCta members={members} />
      </main>
      <Footer />
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  );
}
