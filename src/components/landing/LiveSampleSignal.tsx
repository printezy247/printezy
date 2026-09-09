import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { EzyAiLogo } from "@/components/brand/EzyAiLogo";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import { DEMO, DEMO_RISK, type DemoPrice } from "@/lib/use-demo-price";
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
 *
 * Four preset views sit under the rail. They exist because the thing worth
 * showing a visitor is not that the desk names a price, which anyone can do,
 * but that it can say why: the levels, the readings behind them, what the trade
 * risks, and how it is managed once it is on. Every figure in them is derived
 * from the single setup in `use-demo-price.ts` rather than typed twice, so the
 * panels cannot drift out of agreement with the card above them.
 *
 * The holographic shell is decoration and behaves like it. The tilt and the
 * sheen are written straight to the DOM inside a rAF loop, because a
 * pointermove that re-renders the hero is a stutter you can feel; they are
 * skipped entirely under reduced motion or on a device with no fine pointer,
 * and the card renders flat, legible and complete without them.
 */

/* Everything the panels report, derived once from the setup itself. */
const RISK_PIPS = Math.round(DEMO_RISK / DEMO.pip);
const TP1_PIPS = Math.round((DEMO.tp1 - DEMO.entry) / DEMO.pip);
const TP2_PIPS = Math.round((DEMO.tp2 - DEMO.entry) / DEMO.pip);
const RR1 = (DEMO.tp1 - DEMO.entry) / DEMO_RISK;
const RR2 = (DEMO.tp2 - DEMO.entry) / DEMO_RISK;
/** How far the entry sits from the EMA21, in ATR — the autopilot's chase test. */
const EXTENSION_ATR = Math.abs(DEMO.entry - DEMO.ema21) / DEMO.atr;
/** The stop measured in ATR, which is how the strategy caps it rather than in pips. */
const RISK_ATR = DEMO_RISK / DEMO.atr;

/** The worked sizing example. One percent of a small account, rounded down. */
const ACCOUNT = 5000;
const RISK_FRACTION = 0.01;
const LOTS = Math.floor(((ACCOUNT * RISK_FRACTION) / (DEMO_RISK * DEMO.contractSize)) * 100) / 100;

const money = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: DEMO.decimals,
    maximumFractionDigits: DEMO.decimals,
  });

type ViewId = "levels" | "analysis" | "risk" | "plan";

const TABS: { id: ViewId; label: TranslationKey }[] = [
  { id: "levels", label: "hero_card_tab_levels" },
  { id: "analysis", label: "hero_card_tab_analysis" },
  { id: "risk", label: "hero_card_tab_risk" },
  { id: "plan", label: "hero_card_tab_plan" },
];

/** One label-and-figure line, the shape both the levels and risk panels use. */
function Row({
  label,
  value,
  note,
  tone = "text-foreground",
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-[7px] last:border-b-0">
      <span className="text-[11.5px] font-semibold text-body">{label}</span>
      <span className="flex items-baseline gap-2">
        {note ? (
          <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">{note}</span>
        ) : null}
        <span className={`font-mono text-[14px] font-extrabold tabular-nums ${tone}`}>{value}</span>
      </span>
    </div>
  );
}

/** One checked line of confluence, with the reading that earned it. */
function Reason({ text, reading }: { text: string; reading?: string }) {
  return (
    <li className="flex items-start gap-1.5">
      <Check className="mt-[3px] h-3 w-3 shrink-0 text-primary" aria-hidden />
      <span className="text-[12px] leading-snug text-body">
        {text}
        {reading ? (
          <span className="ml-1.5 font-mono text-[10.5px] tabular-nums text-muted-foreground">
            {reading}
          </span>
        ) : null}
      </span>
    </li>
  );
}

export function LiveSampleSignal({ chart, live }: { chart: ReactNode; live: DemoPrice }) {
  const { t } = useTranslation();
  const { price, rising } = live;
  const [view, setView] = useState<ViewId>("levels");
  const reducedMotion = usePrefersReducedMotion();
  const card = useRef<HTMLDivElement>(null);
  const tabs = useRef<Partial<Record<ViewId, HTMLButtonElement | null>>>({});
  const panelId = useId();

  // Same stop → target rail the real board draws, so the hero and /ezyai read
  // as one thing rather than two different products.
  const travelled = Math.max(
    0,
    Math.min(100, ((price - DEMO.stop) / (DEMO.target - DEMO.stop)) * 100),
  );

  useEffect(() => {
    if (reducedMotion) return;
    // A coarse pointer has no hover to lean into, and the tilt would only ever
    // fire on tap — where it reads as the card wobbling under your thumb.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const node = card.current;
    if (!node) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const draw = () => {
      frame = 0;
      if (!pending) return;
      const box = node.getBoundingClientRect();
      // 0 at the left/top edge, 1 at the right/bottom.
      const px = (pending.x - box.left) / box.width;
      const py = (pending.y - box.top) / box.height;
      node.style.setProperty("--hx", `${px * 100}%`);
      node.style.setProperty("--hy", `${py * 100}%`);
      // Small angles on purpose: enough for the frame to part company with the
      // chart, not so much that the numbers start to keystone.
      node.style.setProperty("--tilt-y", `${(px - 0.5) * 7}deg`);
      node.style.setProperty("--tilt-x", `${(0.5 - py) * 5}deg`);
    };

    const onMove = (event: PointerEvent) => {
      pending = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onEnter = () => node.style.setProperty("--hi", "1");
    const onLeave = () => {
      pending = null;
      node.style.setProperty("--hi", "0");
      node.style.setProperty("--tilt-x", "0deg");
      node.style.setProperty("--tilt-y", "0deg");
    };

    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerenter", onEnter, { passive: true });
    node.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = TABS[(index + step + TABS.length) % TABS.length].id;
    setView(next);
    tabs.current[next]?.focus();
  };

  return (
    <div>
      <div className="holo-stage">
        <div ref={card} className="holo-card shadow-elevated">
          <span aria-hidden="true" className="holo-card__grid">
            <span className="holo-card__scan" />
          </span>
          <span aria-hidden="true" className="holo-card__sheen" />
          <span aria-hidden="true" className="holo-card__corners" />

          <div className="holo-content">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
              <div className="min-w-0">
                <span className="block truncate text-[13.5px] font-bold text-foreground sm:text-sm">
                  {t("hero_sample_symbol")}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className="signal-flag"
                    style={{ "--flag": "#2fbf71" } as CSSProperties}
                    data-pulse="running"
                  >
                    {t("hero_sample_live")}
                  </span>
                  <span className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-primary">
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                    {t("hero_card_direction")} · {DEMO.timeframe}
                  </span>
                </span>
              </div>
              <span className="shrink-0 rounded bg-accent-tint px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-accent">
                {t("hero_sample_badge")}
              </span>
            </div>

            <div className="holo-lift aspect-[16/7] w-full">{chart}</div>

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
                  {money(price)}
                </span>
              </div>
              <div className="signal-rail" style={{ "--rail": "#2fbf71" } as CSSProperties}>
                <span
                  className="signal-rail__fill"
                  data-live="true"
                  style={{ width: `${travelled}%`, transitionDuration: `${DEMO.tickMs}ms` }}
                />
                <span
                  className="signal-entry-mark"
                  style={{
                    left: `${((DEMO.entry - DEMO.stop) / (DEMO.target - DEMO.stop)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div
              role="tablist"
              aria-label={t("hero_card_tabs_label")}
              className="grid grid-cols-4 gap-1.5 border-t border-border px-3 py-2.5 sm:gap-2 sm:px-4"
            >
              {TABS.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabs.current[tab.id] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`${panelId}-tab-${tab.id}`}
                  aria-selected={view === tab.id}
                  aria-controls={`${panelId}-panel`}
                  tabIndex={view === tab.id ? 0 : -1}
                  onClick={() => {
                    setView(tab.id);
                    goTrack(`hero_card_view_${tab.id}`);
                  }}
                  onKeyDown={(event) => onTabKey(event, index)}
                  className="holo-tab"
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>

            <div
              // Keyed on the view so switching restarts the entry animation
              // rather than cross-fading into a panel that is already there.
              key={view}
              id={`${panelId}-panel`}
              role="tabpanel"
              aria-labelledby={`${panelId}-tab-${view}`}
              tabIndex={-1}
              // Held at the tallest panel's height, so the page below the hero
              // does not jump every time a visitor changes view.
              className="holo-panel min-h-[184px] border-t border-border px-4 pb-3.5 pt-2.5 sm:min-h-[176px]"
            >
              {view === "levels" ? (
                <>
                  <Row
                    label={t("hero_card_entry_zone")}
                    value={`${money(DEMO.entryLow)} – ${money(DEMO.entryHigh)}`}
                  />
                  <Row
                    label={t("hero_card_stop")}
                    value={money(DEMO.stop)}
                    note={`−${RISK_PIPS} ${t("hero_card_pips")} · 1R`}
                    tone="text-accent"
                  />
                  <Row
                    label={t("hero_card_tp1")}
                    value={money(DEMO.tp1)}
                    note={`+${TP1_PIPS} ${t("hero_card_pips")} · ${RR1.toFixed(1)}R`}
                    tone="text-primary"
                  />
                  <Row
                    label={t("hero_card_tp2")}
                    value={money(DEMO.tp2)}
                    note={`+${TP2_PIPS} ${t("hero_card_pips")} · ${RR2.toFixed(1)}R`}
                    tone="text-primary"
                  />
                </>
              ) : null}

              {view === "analysis" ? (
                <div className="flex items-start gap-3">
                  <div className="w-12 shrink-0">
                    <div
                      className="score-ring"
                      style={{ "--score": DEMO.score, "--ring": "#2fbf71" } as CSSProperties}
                    >
                      <span className="font-mono text-[13px] font-extrabold tabular-nums text-foreground">
                        {DEMO.score}
                      </span>
                    </div>
                    <p className="mt-1 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-muted-foreground">
                      {t("hero_card_score")}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {t("hero_card_confluence")}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      <Reason text={t("hero_card_reason_structure")} />
                      <Reason
                        text={t("hero_card_reason_ema")}
                        reading={`${money(DEMO.ema21)} › ${money(DEMO.ema50)}`}
                      />
                      <Reason text={t("hero_card_reason_macd")} reading={`+${DEMO.macd}`} />
                      <Reason
                        text={t("hero_card_reason_extension")}
                        reading={`${EXTENSION_ATR.toFixed(1)} ATR`}
                      />
                    </ul>
                  </div>
                </div>
              ) : null}

              {view === "risk" ? (
                <>
                  <Row
                    label={t("hero_card_rr")}
                    value={`1 : ${RR1.toFixed(1)}`}
                    note={t("hero_card_rr_note")}
                    tone="text-primary"
                  />
                  <Row
                    label={t("hero_card_risk_distance")}
                    value={`${RISK_PIPS} ${t("hero_card_pips")}`}
                    note={`${RISK_ATR.toFixed(2)} ATR`}
                    tone="text-accent"
                  />
                  <Row label={t("hero_card_atr")} value={money(DEMO.atr)} />
                  <Row
                    label={t("hero_card_size")}
                    value={`${LOTS.toFixed(2)} ${t("hero_card_lots")}`}
                    note={t("hero_card_account")}
                  />
                </>
              ) : null}

              {view === "plan" ? (
                <ol className="space-y-1.5">
                  {[
                    t("hero_card_plan_1"),
                    t("hero_card_plan_2"),
                    t("hero_card_plan_3"),
                    t("hero_card_plan_4"),
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[9.5px] font-extrabold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-[12px] leading-snug text-body">{step}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <EzyAiLogo className="h-3.5 w-3.5 shrink-0" /> {t("hero_card_engine")}
              </span>
              <span className="truncate text-right font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {t("hero_card_profile")}
              </span>
            </div>
          </div>
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
