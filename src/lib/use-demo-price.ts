import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * The hero's demonstration price.
 *
 * It lives here rather than inside the card because two things now read it —
 * the signal card's rail and the chart behind it — and a price that ticks
 * twice, independently, reads as two unrelated widgets rather than one desk
 * watching one instrument.
 *
 * The walk stays inside the entry → target band on purpose. The badge says
 * SAMPLE and the movement is there to show what a live card does, not to imply
 * this particular trade is open.
 */

export const DEMO = {
  entry: 4598.7,
  stop: 4596.7,
  target: 4600.61,
  tickMs: 1400,
} as const;

export type DemoPrice = {
  price: number;
  rising: boolean;
  /** Ticks up once per update, so consumers can key an animation off it. */
  tick: number;
};

export function useDemoPrice(): DemoPrice {
  const reducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState<DemoPrice>({
    price: DEMO.entry + 0.34,
    rising: true,
    tick: 0,
  });
  const previous = useRef(state.price);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => {
      setState((current) => {
        // Pulled gently back towards the middle of the band, so it wanders
        // rather than walking off one end and sticking there.
        const middle = (DEMO.entry + DEMO.target) / 2;
        const drift = (middle - current.price) * 0.18;
        const noise = (Math.random() - 0.5) * 0.55;
        const next = Math.min(
          DEMO.target - 0.02,
          Math.max(DEMO.entry - 0.4, current.price + drift + noise),
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
