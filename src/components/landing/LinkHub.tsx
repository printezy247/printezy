import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { EzyMapAsset, type EzyMapProduct } from "@/components/brand/EzyMapAsset";
import { MotionControl } from "@/components/brand/MotionControl";
import { goTrack, trackEngagement, trackPageLoad, trackWebVitals } from "@/lib/analytics";
import { LINKS } from "@/lib/links";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const GoldenMascot = lazy(() =>
  import("@/components/brand/GoldenMascot").then((module) => ({ default: module.GoldenMascot })),
);
const POSTER = "/assets/3d/mascot-poster-light.webp";

const MAIN_LINKS = [
  {
    label: "Free weekly class",
    note: "Live Zoom session, every week",
    href: LINKS.freeClass,
    event: "hub_free_class",
    product: "channel",
  },
  {
    label: "Join the free channel",
    note: "Free trading signals on Telegram",
    href: LINKS.freeChannel,
    event: "hub_join_channel",
    product: "miniapp",
  },
  {
    label: "Free charting platform",
    note: "TradingView, free plan via our link",
    href: LINKS.tradingView,
    event: "hub_tradingview",
    product: "pro",
  },
] satisfies { label: string; note: string; href: string; event: string; product: EzyMapProduct }[];

export function LinkHub({ initialMembers }: { initialMembers: number }) {
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const animate = mounted && playing && !reducedMotion;

  useEffect(() => {
    setMounted(true);
    trackPageLoad("link_hub");
    void trackWebVitals().catch(() => {});
    const stop = trackEngagement();
    return () => stop?.();
  }, []);

  return (
    <div className="ezm-hub min-h-screen bg-background text-foreground">
      <main id="main-content" className="hub-layout">
        <header className="hub-profile">
          <div className="hub-mascot-stage" aria-hidden="true">
            <Suspense fallback={<img className="hub-mascot-poster" src={POSTER} alt="" />}>
              {animate ? (
                <GoldenMascot framing="mark" theme="light" />
              ) : (
                <img className="hub-mascot-poster" src={POSTER} alt="" fetchPriority="high" />
              )}
            </Suspense>
          </div>
          {!reducedMotion && (
            <MotionControl playing={playing} onToggle={() => setPlaying(!playing)} />
          )}
          <h1 className="mt-4 text-3xl font-bold">EzyMap ALGO</h1>
          <p className="mt-2 text-sm text-muted-foreground">@ezymap</p>
          <p className="mx-auto mt-3 text-sm text-body">
            Free trading signals, weekly classes, and charting tools.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-mono font-semibold tabular-nums text-primary">
              {initialMembers}+
            </span>{" "}
            traders in the free channel
          </p>
        </header>

        <div className="hub-content">
          <nav aria-label="EzyMap links" className="hub-main-links space-y-3">
            {MAIN_LINKS.map(({ label, note, href, event, product }, index) => (
              <a
                key={event}
                href={href}
                onClick={() => goTrack(event)}
                className={`hub-destination group flex items-center gap-3 border transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${index === 0 ? "hub-destination--primary border-primary/60" : "border-border"}`}
              >
                <span className="grid shrink-0 place-items-center">
                  <EzyMapAsset product={product} className="hub-product-icon" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-xs text-muted-foreground">{note}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
              </a>
            ))}
          </nav>
          <div className="hub-destination hub-coming-soon mt-3 flex items-center gap-3 border border-accent/40">
            <span className="grid shrink-0 place-items-center text-accent">
              <Lock size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 select-none blur-[4px]" aria-hidden="true">
              <span className="block font-semibold">Premium access</span>
              <span className="block text-xs text-muted-foreground">
                Something new is on the way
              </span>
            </span>
            <span className="shrink-0 text-xs font-bold text-accent">Coming soon</span>
          </div>
        </div>

        <footer className="hub-footer text-center text-xs text-muted-foreground">
          <nav aria-label="Site information" className="flex flex-wrap justify-center gap-4">
            <a className="hover:underline" href="/home">
              Full site
            </a>
            <a className="hover:underline" href="/privacy">
              Privacy
            </a>
            <a className="hover:underline" href="/terms">
              Terms
            </a>
          </nav>
          <p className="mt-4">
            We may earn a commission from the TradingView referral link at no extra cost to you.
          </p>
          <p className="mt-2">
            Trading carries risk of loss. Signals are for education, not financial advice.
          </p>
        </footer>
      </main>
    </div>
  );
}
