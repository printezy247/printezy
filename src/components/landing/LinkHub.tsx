import { useEffect, useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowUpRight,
  BadgePercent,
  BookOpen,
  BrainCircuit,
  Briefcase,
  ChevronDown,
  Globe,
  Instagram,
  LineChart,
  Send,
  Wallet,
} from "lucide-react";
import { getActiveMemberCount } from "@/lib/member-count.functions";
import { useCountUp } from "@/lib/use-count-up";
import { goTrack, trackEngagement, trackPageLoad, trackWebVitals } from "@/lib/analytics";
import { LOCALES, LOCALE_LABELS, localizePath, type Locale } from "@/lib/i18n";
import markImg from "@/assets/ezymap-mark.webp";
import { LINKS, PROMO, SOCIALS } from "@/lib/links";
import { FAQ } from "./welcome-data";

/**
 * The `/` link hub — a Linktree-style front door for bio and social traffic.
 * Profile header, social icons, then stacked destination buttons grouped into
 * the four main actions and a "more" collection. Copy stays honest: no
 * invented metrics, and every affiliate link carries the disclosure below.
 */

const FALLBACK_MEMBERS = 640;

type HubLink = {
  label: string;
  note: string;
  href: string;
  /** Set instead of href for in-app destinations (typed router paths). */
  to?: "/home" | "/pricing";
  event: string;
  icon: typeof Send;
  primary?: boolean;
};

const MAIN_LINKS: HubLink[] = [
  {
    label: "Join the free channel",
    note: "Free trading signals on Telegram",
    href: LINKS.freeChannel,
    event: "hub_join_channel",
    icon: Send,
    primary: true,
  },
  {
    label: "Find out more",
    note: "The full EzyMap ALGO website",
    href: "/home",
    to: "/home",
    event: "hub_website",
    icon: Globe,
  },
  {
    label: "Free trading platform",
    note: "TradingView, free plan via our link",
    href: LINKS.tradingView,
    event: "hub_tradingview",
    icon: LineChart,
  },
  {
    label: "Broker to check out",
    note: "VersusTrade partner account",
    href: LINKS.broker,
    event: "hub_broker",
    icon: Briefcase,
  },
];

const MORE_LINKS: HubLink[] = [
  {
    label: "EzyAI analyst",
    note: "Ask about any market, inside Telegram",
    href: LINKS.ezyai,
    event: "hub_ezyai",
    icon: BrainCircuit,
  },
  {
    label: "Macro alerts",
    note: "Economic calendar bot on Telegram",
    href: LINKS.macro,
    event: "hub_macro",
    icon: Globe,
  },
  {
    label: "Free ebook",
    note: "Technical Analysis guide, no card",
    href: LINKS.ebook,
    event: "hub_ebook",
    icon: BookOpen,
  },
  {
    label: "Pricing & memberships",
    note: "Paid plans for the full desk",
    href: "/pricing",
    to: "/pricing",
    event: "hub_pricing",
    icon: Wallet,
  },
  {
    label: PROMO.label,
    note: "Live offer, updated often",
    href: PROMO.href,
    event: "hub_promo",
    icon: BadgePercent,
  },
];

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  TikTok: TikTokIcon,
  Instagram,
  Telegram: Send,
};

function HubButton({ link }: { link: HubLink }) {
  const external = !link.to;
  const className = `group flex min-h-[4.5rem] items-center gap-3 rounded-2xl border px-4 py-3.5 transition-[border-color,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [touch-action:manipulation] ${
    link.primary
      ? "border-primary/50 bg-primary/10 hover:border-primary hover:bg-primary/15"
      : "border-border bg-card hover:border-primary/50 hover:bg-surface-elevated"
  }`;
  const inner = (
    <>
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          link.primary ? "bg-primary text-primary-foreground" : "bg-primary/12 text-primary"
        }`}
      >
        <link.icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-semibold text-foreground">{link.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{link.note}</span>
      </span>
      <ArrowUpRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </>
  );
  return external ? (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => goTrack(link.event)}
      className={className}
    >
      {inner}
    </a>
  ) : (
    <Link to={link.to ?? "/"} onClick={() => goTrack(link.event)} className={className}>
      {inner}
    </Link>
  );
}

function LanguagePicker() {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Language</span>
      <select
        value="en"
        onChange={(event) => {
          const next = event.target.value as Locale;
          goTrack(`hub_lang_${next}`);
          // The translated home lives at /<locale>/home — "/" has no twins.
          window.location.href = localizePath("/home", next);
        }}
        className="min-h-11 min-w-11 appearance-none rounded-md border border-border bg-card py-2 pl-3 pr-8 text-sm font-medium text-body hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <option value="en">{LOCALE_LABELS.en}</option>
        {LOCALES.filter((locale) => locale !== "en").map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
    </label>
  );
}

export function LinkHub({ initialMembers }: { initialMembers?: number }) {
  const [members, setMembers] = useState(initialMembers ?? FALLBACK_MEMBERS);
  const count = useCountUp(members);
  const getMembers = useServerFn(getActiveMemberCount);

  useEffect(() => {
    if (initialMembers === undefined) {
      void getMembers({ data: undefined })
        .then(setMembers)
        .catch(() => {
          /* keep the fallback; the count must never block the page */
        });
    }
    trackPageLoad("link_hub");
    void trackWebVitals().catch(() => {});
    const stop = trackEngagement();
    return () => stop?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Soft brand glow behind the profile, like a lit trading desk. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(47,191,113,0.14),transparent_65%)]"
      />
      <main className="relative mx-auto w-full max-w-md px-4 pb-16 pt-10 sm:pt-14">
        <header className="text-center">
          <img
            src={markImg}
            width={88}
            height={88}
            alt="EzyMap ALGO gem mark"
            decoding="async"
            className="mx-auto h-[88px] w-[88px] rounded-3xl object-contain"
          />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">EzyMap ALGO</h1>
          <p className="mt-1 text-sm text-muted-foreground">@ezymap</p>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-body">
            Free trading signals, daily education and AI tools — straight to your phone.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-body">
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse"
              aria-hidden="true"
            />
            <span className="font-mono font-semibold tabular-nums text-primary">{count}+</span>{" "}
            traders in the free channel
          </p>
        </header>

        <nav aria-label="EzyMap links" className="mt-8 space-y-3">
          {MAIN_LINKS.map((link) => (
            <HubButton key={link.event} link={link} />
          ))}
        </nav>

        <section aria-labelledby="hub-more" className="mt-10">
          <h2
            id="hub-more"
            className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            More from EzyMap
          </h2>
          <nav aria-label="More EzyMap links" className="mt-4 space-y-3">
            {MORE_LINKS.map((link) => (
              <HubButton key={link.event} link={link} />
            ))}
          </nav>
        </section>

        <ul aria-label="Social profiles" className="mt-8 flex justify-center gap-3">
          {SOCIALS.map(({ label, href }) => {
            const Icon = SOCIAL_ICONS[label];
            return (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  onClick={() => goTrack(`hub_social_${label.toLowerCase()}`)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [touch-action:manipulation]"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>

        <section aria-labelledby="hub-faq" className="mt-12">
          <h2 id="hub-faq" className="text-center text-lg font-bold tracking-tight">
            Questions
          </h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card px-4">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="pb-3 text-sm leading-relaxed text-body">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-10 text-center">
          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
          >
            <Link to="/home" className="hover:text-foreground">
              Full site
            </Link>
            <Link to="/faq" className="hover:text-foreground">
              FAQ
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <LanguagePicker />
          </nav>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Some links are affiliate or referral links; we may earn a commission at no extra cost to
            you.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-body">Risk warning:</strong> trading carries a high level of
            risk. Signals are information, not financial advice.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} EzyMap ALGO. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
