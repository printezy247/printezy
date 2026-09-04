import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Animates a displayed integer toward `target` whenever it changes, so a
 * stat that resolves from a fallback to a live value (or updates live)
 * visibly counts up instead of popping in. Skips the animation entirely
 * under prefers-reduced-motion.
 */
export function useCountUp(target: number, durationMs = 800) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;

    if (reducedMotion || from === to) {
      setDisplay(to);
      return;
    }

    let raf: number;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reducedMotion]);

  return display;
}
