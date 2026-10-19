import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
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
      className={`group inline-flex min-h-14 items-center justify-center gap-3 rounded-sm px-8 py-4 text-lg font-extrabold uppercase tracking-wide shadow-[0_6px_0_0_#1fa55e] transition-all duration-150 hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#1fa55e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 ${GREEN} ${wide ? "w-full" : ""}`}
    >
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
      <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-neutral-950 [text-wrap:balance] sm:text-5xl">
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

function Phone({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <figure className="mx-auto w-full max-w-[300px]">
      <div className="rounded-[2.2rem] border-[7px] border-neutral-900 bg-neutral-900 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
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

const SAMPLE_FEED = (
  <>
    <AlertCard
      pair="XAUUSD"
      side="BUY"
      time="now"
      lines={[
        ["Entry", "2,341.5"],
        ["Stop", "2,336.2"],
        ["TP1", "2,349.0"],
        ["TP2", "2,358.4"],
      ]}
    />
    <AlertCard
      pair="BTCUSD"
      side="SELL"
      time="12m"
      lines={[
        ["Entry", "67,420"],
        ["Stop", "68,150"],
        ["TP1", "66,300"],
        ["TP2", "65,100"],
      ]}
    />
    <AlertCard
      pair="EURUSD"
      side="BUY"
      time="38m"
      lines={[
        ["Entry", "1.0842"],
        ["Stop", "1.0811"],
        ["TP1", "1.0890"],
        ["TP2", "1.0936"],
      ]}
    />
  </>
);

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Hero({ members }: { members: number }) {
  const count = useCountUp(members);
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:pb-24 lg:pt-20">
        <div className="text-center lg:text-left">
          <h1 className="text-[40px] font-extrabold leading-[1.04] tracking-tight text-neutral-950 [text-wrap:balance] sm:text-6xl lg:text-[64px]">
            Never Miss A Trade Setup <span className="whitespace-nowrap">Again.</span>
          </h1>
          <p className="mt-5 text-lg font-extrabold uppercase tracking-wide text-red-600 sm:text-xl">
            *** Free to join · No card · Leave any time ***
          </p>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-neutral-700 lg:mx-0">
            Live trading alerts land on your phone the moment a setup forms, with the entry, stop,
            targets and the reason. No more watching charts all day.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <JoinButton where="hero" />
            <MoreLink where="hero" />
          </div>
          <p className="mt-5 text-sm font-semibold text-neutral-600">
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full bg-[#1fa55e] motion-safe:animate-pulse"
              aria-hidden="true"
            />
            {count}+ traders already inside the channel
          </p>
        </div>
        <Phone caption="Illustrative sample alerts, not live trades.">{SAMPLE_FEED}</Phone>
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
    body: "The clean entry printed an hour ago. Now the candle has already run and you wonder whether to chase.",
  },
  {
    icon: Layers,
    title: "Too much noise",
    body: "Ten indicators, three timeframes, a dozen opinions. Everything disagrees, so you freeze or you gamble.",
  },
  {
    icon: ShieldAlert,
    title: "No plan once you are in",
    body: "Where does the stop go? When do you take profit? Without levels set first, emotion makes the call.",
  },
];

function Pain() {
  return (
    <section className="bg-white px-5 py-20 sm:px-8">
      <Reveal>
        <Heading>Trading alone is a full-time job nobody pays you for.</Heading>
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
        {PAINS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.1}>
            <div className="h-full rounded-lg border-2 border-neutral-900 bg-white p-7 shadow-[6px_6px_0_0_#171717]">
              <p.icon className="h-8 w-8 text-red-600" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-extrabold text-neutral-950">{p.title}</h3>
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
    body: "When a setup forms your phone buzzes with the full plan: entry, stop, targets, why.",
  },
  {
    n: "3",
    title: "Act on your terms",
    body: "Take it, skip it, or study it. Daily education shows the reasoning so you keep improving.",
  },
];

function HowItWorks() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50 px-5 py-20 sm:px-8">
      <Reveal>
        <Heading sub="It takes under a minute to get started.">Three simple steps</Heading>
      </Reveal>
      <ol className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.n}>
            <Reveal delay={i * 0.1} className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neutral-950 text-2xl font-extrabold text-[#3ddc84]">
                {s.n}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-neutral-950">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-neutral-700">{s.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
      <Reveal className="mt-12">
        <CtaPair where="steps" />
      </Reveal>
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
    <section className="bg-white px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-neutral-950 [text-wrap:balance] sm:text-5xl">
            A complete trade plan, not a vague hint.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-700">
            Most signal groups shout a ticker and a direction. Ours hands you the whole plan, so you
            always know your risk before you act.
          </p>
          <ul className="mt-8 space-y-4">
            {ANATOMY.map((a) => (
              <li key={a.k} className="flex gap-3">
                <BellRing className="mt-1 h-5 w-5 shrink-0 text-[#1fa55e]" aria-hidden="true" />
                <p className="text-neutral-700">
                  <strong className="text-neutral-950">{a.k}.</strong> {a.v}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <Phone caption="Illustrative sample alert.">
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
          </Phone>
        </Reveal>
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
    <section className="border-y border-neutral-200 bg-neutral-50 px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <Reveal className="lg:order-2">
          <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-neutral-950 [text-wrap:balance] sm:text-5xl">
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
    <section className="bg-white px-5 py-20 sm:px-8">
      <Reveal>
        <Heading>Before you join</Heading>
      </Reveal>
      <div className="mx-auto mt-10 max-w-3xl divide-y-2 divide-neutral-900 border-y-2 border-neutral-900">
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
    <section className="bg-[#3ddc84] px-5 py-20 text-center sm:px-8">
      <Reveal className="mx-auto max-w-3xl">
        <h2 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-950 [text-wrap:balance] sm:text-6xl">
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
  return (
    <footer className="bg-black px-5 py-12 text-neutral-400 sm:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <Mark size={40} className="mx-auto mb-4" />
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
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
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
        <Anatomy />
        <EzyAi />
        <Faq />
        <FinalCta members={members} />
      </main>
      <Footer />
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  );
}
