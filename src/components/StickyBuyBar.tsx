import { useEffect, useRef, useState } from "react";
import { BuyButton } from "@/components/BuyButton";
import { getCatalogItem, formatUsd } from "@/lib/catalog";

const SKU = "signal_premium";

/** Mobile-only sticky buy bar, shown once the hero has scrolled out of view. */
export function StickyBuyBar() {
  const [pastHero, setPastHero] = useState(false);
  const [ctaOnScreen, setCtaOnScreen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const item = getCatalogItem(SKU);

  useEffect(() => {
    const hero = document.querySelector("section.bg-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // The bar exists to keep a buy button within reach while none is on screen.
  // Once a real one scrolls into view the bar is both redundant and in the
  // way — it sits at the bottom of the viewport, which is exactly where a
  // card's own button lands as you scroll to it.
  useEffect(() => {
    if (!pastHero) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-buy-cta]")).filter(
      (el) => !barRef.current?.contains(el),
    );
    if (targets.length === 0) return;

    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.add(entry.target);
          else onScreen.delete(entry.target);
        }
        setCtaOnScreen(onScreen.size > 0);
      },
      // Count a button as reached a little before it clears the bar, so the
      // two never overlap mid-scroll.
      { rootMargin: "0px 0px -96px 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [pastHero]);

  const shown = pastHero && !ctaOnScreen;

  // Signal other fixed-position mobile UI (the support chat trigger) to shift
  // up so it doesn't collide with the bar.
  useEffect(() => {
    if (!shown) {
      document.body.removeAttribute("data-sticky-buy-bar-visible");
      return;
    }
    document.body.setAttribute("data-sticky-buy-bar-visible", "true");
    return () => document.body.removeAttribute("data-sticky-buy-bar-visible");
  }, [shown]);

  // Reserve the height the bar covers so the foot of the page can be scrolled
  // clear of it. Held for as long as the bar is mounted rather than only while
  // it is showing: tying it to visibility would change the page length every
  // time the bar stepped aside, jittering the scroll mid-gesture.
  useEffect(() => {
    if (!pastHero) return;
    const height = barRef.current?.offsetHeight ?? 0;
    if (!height) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = `${height}px`;
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [pastHero]);

  if (!item || !pastHero) return null;

  return (
    <div
      ref={barRef}
      aria-hidden={ctaOnScreen}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-200 sm:hidden ${
        ctaOnScreen ? "pointer-events-none translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatUsd(item.amountCents)}
          </p>
        </div>
        <BuyButton sku={SKU} label="Enroll Now" className="w-auto shrink-0" />
      </div>
    </div>
  );
}
