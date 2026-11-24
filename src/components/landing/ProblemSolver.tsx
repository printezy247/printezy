import { useState } from "react";
import {
  Crosshair,
  ShieldAlert,
  BrainCircuit,
  Timer,
  TrendingDown,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { goTrack } from "@/lib/analytics";
import { Reveal, Section, SectionHeading } from "./primitives";

/**
 * Common trader problems and what EzyMap solves — a before/after visual grid.
 *
 * Each card shows the pain on the left (muted, struck-through) and the fix on
 * the right (lit, primary). Hovering flips the card's glow from red-gold to
 * green. No framer-motion: the flip is a CSS perspective transform, the glow
 * swap is a box-shadow transition. Ponytail: reuse glass-card + signal-flag
 * styles already in styles.css.
 */

type Problem = {
  id: string;
  icon: LucideIcon;
  problem: string;
  solution: string;
  event: string;
};

const PROBLEMS: Problem[] = [
  {
    id: "entry",
    icon: Crosshair,
    problem: "Chasing entries after the move already happened",
    solution: "Entry zones with limit orders placed before the candle forms",
    event: "problem_entry",
  },
  {
    id: "stop",
    icon: ShieldAlert,
    problem: "Stops hunted at the wick before price reverses your way",
    solution: "ATR-based stop placement below the liquidity sweep zone",
    event: "problem_stop",
  },
  {
    id: "revenge",
    icon: BrainCircuit,
    problem: "Revenge trading after a loss, doubling down on tilt",
    solution: "Pre-defined risk per trade with automated position sizing",
    event: "problem_revenge",
  },
  {
    id: "timing",
    icon: Timer,
    problem: "No plan before the candle closes, reacting instead of reading",
    solution: "Signals published with levels, targets and invalidation upfront",
    event: "problem_timing",
  },
  {
    id: "drawdown",
    icon: TrendingDown,
    problem: "Adding to losers, averaging down into a collapsing trend",
    solution: "Drawdown Guardian indicator blocks entries against the MTF bias",
    event: "problem_drawdown",
  },
  {
    id: "target",
    icon: Target,
    problem: "Closing winners too early out of fear, leaving R:R on the table",
    solution: "Scaled TP1/TP2 levels with trailing stop rules built into every signal",
    event: "problem_target",
  },
];

function ProblemCard({ item, index }: { item: Problem; index: number }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const hovered = hover || pinned;
  const Icon = item.icon;

  return (
    <Reveal delay={index * 0.06}>
      <article
        onClick={() => { setPinned((v) => !v); goTrack(item.event); }}
        tabIndex={0}
        role="button"
        aria-expanded={hovered}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPinned((v) => !v);
            goTrack(item.event);
          }
        }}
        className={`group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-300 ${
          hovered
            ? "border-primary/50 bg-surface-elevated shadow-[0_0_30px_-8px_rgba(47,191,113,0.3)]"
            : "border-border bg-card hover:border-accent/40"
        }`}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(true); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setHover(false); }}
      >
        {/* Top accent bar that transitions from destructive gold to primary green */}
        <div
          className={`absolute inset-x-0 top-0 h-[2px] transition-colors duration-300 ${
            hovered ? "bg-primary" : "bg-accent/40"
          }`}
          aria-hidden="true"
        />

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {/* Icon + header */}
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-colors duration-300 ${
                hovered
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span
              className={`font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-300 ${
                hovered ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {hovered ? "Solved" : "Problem"}
            </span>
          </div>

          {/* Before / After split */}
          <div className="mt-4 flex-1">
            {/* The problem — visible always, struck through when solved */}
            <p
              className={`text-sm leading-relaxed transition-all duration-300 ${
                hovered
                  ? "text-muted-foreground/50 line-through decoration-accent/40"
                  : "text-body"
              }`}
            >
              {item.problem}
            </p>

            {/* The solution — fades in on hover/focus */}
            <p
              className={`mt-2 text-sm font-medium leading-relaxed text-primary transition-all duration-300 ${
                hovered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
              aria-hidden={!hovered}
            >
              {item.solution}
            </p>
          </div>

          {/* Bottom hint */}
          <p className="mt-4 text-[11px] text-muted-foreground">
            {hovered ? "Tap to toggle the fix" : "Tap or hover to see the fix"}
          </p>
        </div>
      </article>
    </Reveal>
  );
}

export function ProblemSolver() {
  const { t } = useTranslation();
  return (
    <Section id="problems" className="bg-surface/40">
      <SectionHeading
        eyebrow={t("features_eyebrow")}
        title="Every signal solves a real mistake"
        subtitle="Common traps traders fall into — and exactly how EzyMap ALGO indicators and signals prevent them. Hover any card to see the fix."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROBLEMS.map((item, i) => (
          <ProblemCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </Section>
  );
}
