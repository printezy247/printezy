import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * The hero's demonstration setup, and the price walking through it.
 *
 * It lives here rather than inside the card because three things now read it —
 * the signal card's rail, the chart behind it and the card's analysis panels —
 * and a price that ticks twice, independently, reads as two unrelated widgets
 * rather than one desk watching one instrument.
 *
 * The walk stays inside the entry → target band on purpose. The badge says
 * SAMPLE and the movement is there to show what a live card does, not to imply
 * this particular trade is open.
 *
 * Every number below is one the autopilot could actually have published. The
 * card now shows its reasoning, so the reasoning has to survive a trader
 * reading it: the levels, the readings behind them and the score are all
 * mutually consistent under the real `intraday` profile in
 * `src/lib/ezyai/autopilot.ts` — bullish EMA stack, MACD on the same side of
 * zero, entry half an ATR off the EMA21, risk 0.74 ATR against a cap of 4, and
 * a 1.5 R first target against a floor of 1.3. Change one and the rest stop
 * agreeing with it.
 */

export const DEMO = {
  symbol: "XAUUSD",
  timeframe: "15m",

  /* Levels, as the board publishes them: the entry is a zone, not a point. */
  entryLow: 4597.9,
  entryHigh: 4598.7,
  /** The fill the rail and the walk measure from — the top of the zone. */
  entry: 4598.7,
  stop: 4595.3,
  tp1: 4603.8,
  tp2: 4607.2,
  /** The rail runs stop → first target, the same as the live board's does. */
  target: 4603.8,

  /* The readings behind the setup. */
  ema21: 4596.4,
  ema50: 4592.1,
  macd: 1.24,
  atr: 4.6,
  /**
   * 42/100 from the autopilot's own scoring terms — the same score the desk's
   * first real XAUUSD signal earned. A sample card claiming 90 would be
   * advertising a number the board never prints.
   */
  score: 42,

  /* How gold is quoted and sized. */
  decimals: 2,
  pip: 0.1,
  /** One lot is 100 oz, so a $1 move is $100 a lot. */
  contractSize: 100,

  tickMs: 1400,
} as const;

/** Distance to the stop, in price. Every risk figure on the card divides by it. */
export const DEMO_RISK = DEMO.entry - DEMO.stop;

export type DemoPrice = {
  price: number;
  rising: boolean;
  /** Ticks up once per update, so consumers can key an animation off it. */
  tick: number;
};

export function useDemoPrice(): DemoPrice {
  const reducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState<DemoPrice>({
    price: DEMO.entry + (DEMO.target - DEMO.entry) * 0.35,
    rising: true,
    tick: 0,
  });
  const previous = useRef(state.price);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => {
      setState((current) => {
        // Pulled gently back towards the middle of the band, so it wanders
        // rather than walking off one end and sticking there. Both the pull and
        // the noise are measured as a fraction of the band, so widening the
        // levels widens the walk with them instead of freezing it.
        const span = DEMO.target - DEMO.entry;
        const middle = (DEMO.entry + DEMO.target) / 2;
        const drift = (middle - current.price) * 0.14;
        const noise = (Math.random() - 0.5) * span * 0.22;
        const next = Math.min(
          DEMO.target - span * 0.01,
          Math.max(DEMO.entry - span * 0.18, current.price + drift + noise),
        );
        const rising = next >= previous.current;
        previous.current = next;
        return { price: next, rising, tick: current.tick + 1 };
      });
    }, DEMO.tickMs);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  return state;
}
