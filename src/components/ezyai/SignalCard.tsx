import { useEffect, useState, type CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import type { TranslationKey } from "@/lib/translations";
import { useTranslation } from "@/lib/i18n";
import {
  entryMid,
  isLive,
  liveR,
  progressPercent,
  STATUS_COLOR,
  type EzyAiSignal,
  type SignalStatus,
} from "@/lib/ezyai/signals";

const STATUS_KEY: Record<SignalStatus, TranslationKey> = {
  pending: "ezyai_sig_status_pending",
  running: "ezyai_sig_status_running",
  tp: "ezyai_sig_status_tp",
  be: "ezyai_sig_status_be",
  sl: "ezyai_sig_status_sl",
  cancelled: "ezyai_sig_status_cancelled",
};

/** Prices span gold at four figures and FX at five decimals — fit both. */
function price(value: number | null): string {
  if (value == null) return "—";
  const decimals = Math.abs(value) >= 100 ? 2 : Math.abs(value) >= 1 ? 4 : 5;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function signedR(value: number | null): string {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}R`;
}

export function StatusFlag({ status }: { status: SignalStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className="signal-flag"
      style={{ "--flag": STATUS_COLOR[status] } as CSSProperties}
      data-pulse={status === "running" || status === "pending" ? status : undefined}
    >
      {t(STATUS_KEY[status])}
    </span>
  );
}

/**
 * The stop → target rail with the live price on it. The whole point of the
 * card: one glance says how far this trade has come and which way it is
 * leaning, without reading a single number.
 */
function Rail({ signal }: { signal: EzyAiSignal }) {
  const target = signal.tp1 ?? signal.tp2;
  const travelled = progressPercent(signal.lastPrice, signal.stopPrice, target, signal.direction);
  const entryAt = progressPercent(entryMid(signal), signal.stopPrice, target, signal.direction);

  // Grow from zero on first paint so the bar arrives by running, the same way
  // the Fear & Greed gauges do.
  const [drawn, setDrawn] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const colour = STATUS_COLOR[signal.status];
  const width = travelled == null ? 0 : drawn || reducedMotion ? travelled : 0;

  return (
    <div className="signal-rail" style={{ "--rail": colour } as CSSProperties}>
      {travelled == null ? (
        <span className="signal-rail__idle" />
      ) : (
        <>
          <span
            className="signal-rail__fill"
            data-live={signal.status === "running" ? "true" : undefined}
            style={{ width: `${width}%` }}
          />
          {entryAt == null ? null : (
            <span className="signal-entry-mark" style={{ left: `${entryAt}%` }} />
          )}
        </>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const shown = useCountUp(score, 900);
  const tone = score >= 75 ? "#2fbf71" : score >= 50 ? "#c9a13a" : "#8b948f";
  return (
    <span
      className="score-ring"
      style={{ "--score": score, "--ring": tone } as CSSProperties}
      aria-hidden
    >
      <span className="font-mono text-[13px] font-bold tabular-nums text-foreground">{shown}</span>
    </span>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-[13px] tabular-nums text-foreground">{children}</p>
    </div>
  );
}

export function SignalCard({ signal, index = 0 }: { signal: EzyAiSignal; index?: number }) {
  const { t } = useTranslation();
  const running = liveR(signal);
  const live = isLive(signal.status);
  const Arrow = signal.direction === "buy" ? ArrowUpRight : ArrowDownRight;
  const dirColour = signal.direction === "buy" ? "text-primary" : "text-destructive";

  const zone =
    signal.entryLow != null && signal.entryHigh != null
      ? `${price(signal.entryLow)} – ${price(signal.entryHigh)}`
      : price(entryMid(signal));

  return (
    <article
      className="card-lift rounded-xl border border-border bg-card p-4"
      // A gentle stagger so a board that refreshes reads as a list arriving
      // rather than a block appearing.
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="truncate">{signal.symbol}</span>
            <Arrow className={`h-4 w-4 shrink-0 ${dirColour}`} aria-hidden />
            <span className={`text-xs font-bold uppercase ${dirColour}`}>{signal.direction}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[signal.timeframe, signal.setup].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {signal.setupScore != null ? <ScoreRing score={signal.setupScore} /> : null}
          <StatusFlag status={signal.status} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <span>
            {t("ezyai_sig_sl")} <span className="font-mono">{price(signal.stopPrice)}</span>
          </span>
          {live && running != null ? (
            <span
              className="font-mono text-[11px] tabular-nums"
              style={{ color: running >= 0 ? "#2fbf71" : "#d9534f" }}
            >
              {signedR(running)}
            </span>
          ) : signal.resultR != null ? (
            <span
              className="font-mono text-[11px] tabular-nums"
              style={{ color: STATUS_COLOR[signal.status] }}
            >
              {signedR(signal.resultR)}
            </span>
          ) : null}
          <span>
            {t("ezyai_sig_tp")} <span className="font-mono">{price(signal.tp1 ?? signal.tp2)}</span>
          </span>
        </div>
        <Rail signal={signal} />
      </div>

      {/* The zone carries two prices and needs twice the room, or it wraps
          mid-range and stops reading as one number. */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="col-span-2 min-w-0">
          <Stat label={t("ezyai_sig_entry")}>{zone}</Stat>
        </div>
        <Stat label={t("ezyai_sig_rr")}>{signal.rr != null ? `1 : ${signal.rr}` : "—"}</Stat>
        <Stat label={t("ezyai_sig_tp2")}>{price(signal.tp2)}</Stat>
      </div>

      {signal.note ? (
        <p className="mt-3 border-t border-border pt-3 text-xs leading-snug text-body">
          {signal.note}
        </p>
      ) : null}
    </article>
  );
}
