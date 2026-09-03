import { useEffect, useState } from "react";
import { BuyButton } from "@/components/BuyButton";
import { getCatalogItem, formatUsd } from "@/lib/catalog";

const SKU = "signal_premium";

/** Mobile-only sticky buy bar, shown once the hero has scrolled out of view. */
export function StickyBuyBar() {
  const [visible, setVisible] = useState(false);
  const item = getCatalogItem(SKU);

  useEffect(() => {
    const hero = document.querySelector("section.bg-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!item || !visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">{formatUsd(item.amountCents)}</p>
        </div>
        <BuyButton sku={SKU} label="Enroll Now" className="w-auto shrink-0" />
      </div>
    </div>
  );
}
