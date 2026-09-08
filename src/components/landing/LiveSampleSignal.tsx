import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { goTrack } from "@/lib/analytics";

/**
 * The hero's signal card, showing the format the desk publishes in.
 *
 * It ticks, but it stays honestly labelled: the badge still says "sample" and
 * the price only ever drifts inside the band between the entry and the target.
 * The movement is there to show what a live card does, not to imply this
 * particular trade is open — the button underneath is the honest route to the
 * ones that actually are.
 */

const ENTRY = 4598.7;
const STOP = 4596.7;
const TARGET = 4600.61;
const TICK_MS = 1400;

/** A gentle wander inside the entry → target band, never past either end. */
function useDemoPrice(): { price: number; rising: boolean } {
  const reducedMotion = usePrefersReducedMotion();
  const [price, setPrice] = useState(ENTRY + 0.34);
  const [rising, setRising] = useState(true);
  const previous = useRef(price);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => {
      setPrice((current) => {
        // Pulled gently back towards the middle of the band, so it wanders
        // rather than walking off one end and sticking there.
        const middle = (ENTRY + TARGET) / 2;
        const drift = (middle - current) * 0.18;
        const noise = (Math.random() - 0.5) * 0.55;
        const next = Math.min(TARGET - 0.02, Math.max(ENTRY - 0.4, current + drift + noise));
        setRising(next >= previous.current);
        previous.current = next;
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  return { price, rising };
}

function Cell({ label, value, tone }: { label: string; value: ReactNode; tone: string }) {
  return (
    <div className="bg-secondary px-3 py-3 text-center">
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-mono text-sm font-extrabold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

export function LiveSampleSignal({ chart }: { chart: ReactNode }) {
  const { t } = useTranslation();
  const { price, rising } = useDemoPrice();

  // Same stop → target rail the real board draws, so the hero and /ezyai read
  // as one thing rather than two different products.
  const travelled = Math.max(0, Math.min(100, ((price - STOP) / (TARGET - STOP)) * 100));

  return (
    <div>
      <div className="rounded-md border border-border bg-card shadow-elevated">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            {t("hero_sample_symbol")}
            <span
              className="signal-flag"
              style={{ "--flag": "#2fbf71" } as CSSProperties}
              data-pulse="running"
            >
              {t("hero_sample_live")}
            </span>
          </span>
          <span className="rounded bg-accent-tint px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-accent">
            {t("hero_sample_badge")}
          </span>
        </div>

        <div className="h-40 px-2 py-3 sm:h-48">{chart}</div>

        <div className="px-4 pb-3">
          <div className="flex items-baseline justify-between pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t("hero_sample_now")}
            </span>
            <span
              className={`font-mono text-sm font-extrabold tabular-nums transition-colors duration-300 ${
                rising ? "text-primary" : "text-destructive"
              }`}
            >
              {price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="signal-rail" style={{ "--rail": "#2fbf71" } as CSSProperties}>
            <span
              className="signal-rail__fill"
              data-live="true"
              style={{ width: `${travelled}%`, transitionDuration: `${TICK_MS}ms` }}
            />
            <span
              className="signal-entry-mark"
              style={{ left: `${((ENTRY - STOP) / (TARGET - STOP)) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
          <Cell label={t("hero_sample_entry")} value="4,598.70" tone="text-foreground" />
          <Cell label={t("hero_sample_stop")} value="4,596.70" tone="text-accent" />
          <Cell label={t("hero_sample_target")} value="4,600.61" tone="text-primary" />
        </div>
      </div>

      <Link
        to="/ezyai"
        search={{ tab: "live" }}
        onClick={() => goTrack("hero_sample_open_board")}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/8 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
      >
        {t("hero_sample_cta")} <ArrowRight className="h-4 w-4" />
      </Link>

      <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
        {t("hero_disclaimer")}
      </p>
    </div>
  );
}
