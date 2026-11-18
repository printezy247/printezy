import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, Briefcase, Gift, Instagram, Send } from "lucide-react";
import type { ComponentType } from "react";
import { goTrack } from "@/lib/analytics";
import { LINKS, PROMO, SOCIALS } from "@/lib/links";
import { imgProps } from "@/lib/responsive-images";
import { localizedHead } from "@/lib/seo";

const brandLogo = "/__l5e/assets-v1/1d73bbe2-5c3b-4399-8e48-1eace4a5ed77/ezymap-logo.png";

const HEAD = localizedHead({
  path: "/links",
  locale: "en",
  title: "EzyMap ALGO — Links",
  description:
    "Free Telegram signals channel, the EzyMap site, our broker partner and the current promotion — all in one place.",
  image: "default",
  twinPath: null,
  crumbName: "Links",
});

export const Route = createFileRoute("/links")({
  head: () => HEAD,
  component: LinksPage,
});

type Action = {
  label: string;
  note: string;
  href: string;
  event: string;
  icon: typeof Send;
};

export const ACTIONS: Action[] = [
  {
    label: "Free EzyMap channel",
    note: "Signals straight to Telegram",
    href: LINKS.freeChannel,
    event: "links_free_channel",
    icon: Send,
  },
  {
    label: "Website",
    note: "Everything about EzyMap ALGO",
    href: "/home",
    event: "links_website",
    icon: BookOpen,
  },
  {
    label: "Broker recommendation",
    note: "Partner account we recommend",
    href: LINKS.broker,
    event: "links_broker",
    icon: Briefcase,
  },
  {
    label: PROMO.label,
    note: "Live offer, updated often",
    href: PROMO.href,
    event: "links_promo",
    icon: Gift,
  },
];

const SOCIAL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  TikTok: TikTokIcon,
  Instagram,
  Telegram: Send,
};

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function LinksPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:py-16">
      <main className="mx-auto w-full max-w-md">
        <header className="text-center">
          <img
            {...imgProps(brandLogo, "88px")}
            alt=""
            decoding="async"
            className="mx-auto h-22 w-22 rounded-2xl object-contain"
          />
          <h1 className="mt-4 text-2xl tracking-tight">EzyMap ALGO</h1>
          <p className="mt-2 text-sm leading-relaxed text-body">
            Trading signals and daily education. Pick where you want to go.
          </p>
        </header>

        <nav aria-label="EzyMap links" className="mt-8 space-y-3">
          {ACTIONS.map(({ label, note, href, event, icon: Icon }) => {
            const external = href.startsWith("http");
            const className =
              "group flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/60 hover:bg-surface active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [touch-action:manipulation]";
            const inner = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{note}</span>
                </span>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </>
            );
            return external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack(event)}
                className={className}
              >
                {inner}
              </a>
            ) : (
              <Link key={label} to="/home" onClick={() => goTrack(event)} className={className}>
                {inner}
              </Link>
            );
          })}
        </nav>

        <ul aria-label="Social profiles" className="mt-6 flex justify-center gap-3">
          {SOCIALS.map(({ label, href }) => {
            const Icon = SOCIAL_ICONS[label];
            return (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  onClick={() => goTrack(`links_social_${label.toLowerCase()}`)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [touch-action:manipulation]"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Some links are affiliate or referral links; we may earn a commission at no extra cost to
          you. Trading carries risk. Signals are information, not financial advice.
        </p>
      </main>
    </div>
  );
}
