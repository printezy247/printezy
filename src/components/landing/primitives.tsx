import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

/* Apple-style easing: slow, buttery, settles gently */
export const APPLE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * The shared landing-page layout primitives. Kept apart from Landing.tsx so the
 * FAQ and any other page section can use them without pulling the marketing
 * page — or framer-motion — into their chunk.
 */

/**
 * Fade-and-rise on first scroll into view, in CSS rather than framer-motion:
 * the same 400ms Apple-style ease as the rest of the page, but a few bytes
 * instead of a 450 KB library, and the text is still in the server-rendered
 * HTML for crawlers and for readers whose JavaScript never runs.
 */
export function Reveal({
  children,
  delay = 0,
  y = 32,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setShown(true);
      return;
    }
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-40px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${className}`}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px) scale(0.985)`,
        transitionDelay: shown && delay ? `${delay}s` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        {eyebrow ? (
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {subtitle ? <p className="mt-4 text-base text-body">{subtitle}</p> : null}
      </div>
    </Reveal>
  );
}
