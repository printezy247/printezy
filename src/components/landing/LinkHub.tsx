import { useEffect } from "react";
import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import { EzyMapAsset, type EzyMapProduct } from "@/components/brand/EzyMapAsset";
import { MarketingLoop } from "@/components/brand/MarketingLoop";
import { goTrack, trackEngagement, trackPageLoad, trackWebVitals } from "@/lib/analytics";
import { LINKS } from "@/lib/links";
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
  useEffect(() => {
    trackPageLoad("link_hub");
    void trackWebVitals().catch(() => {});
    const stop = trackEngagement();
    return () => stop?.();
  }, []);

  return (
    <div className="ezm-hub min-h-screen bg-background text-foreground">
      <main id="main-content" className="hub-layout">
        <header className="hub-profile">
          <MarketingLoop
            className="hub-mascot-stage"
            src="/assets/3d/mascot-preview.mp4"
            poster="/assets/3d/mascot-preview.webp"
          />
          <p className="hub-handle">@ezymap</p>
          <h1>EzyMap ALGO</h1>
          <p className="hub-summary">Free trading signals, weekly classes, and charting tools.</p>
          <p className="hub-member">
            <strong>{initialMembers.toLocaleString("en")}+</strong> traders in the free channel
          </p>
        </header>

        <div className="hub-content">
          <nav aria-label="EzyMap links" className="hub-main-links space-y-3">
            <a href="/home" className="hub-site-button" onClick={() => goTrack("hub_main_site")}>
              Explore the main website <ArrowRight size={18} aria-hidden="true" />
            </a>
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
            <span className="min-w-0 flex-1 font-semibold">Premium access</span>
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
