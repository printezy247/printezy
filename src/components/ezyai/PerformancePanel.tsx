import { useCountUp } from "@/lib/use-count-up";
import { useTranslation } from "@/lib/i18n";
import { formatLocalTime } from "@/lib/local-time";
import { StatusFlag } from "./SignalCard";
import { STATUS_COLOR } from "@/lib/ezyai/signals";
import type { EzyAiPerformance, EzyAiSignal } from "@/lib/ezyai/signals";

function signedR(value: number | null): string {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}R`;
}

function Metric({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-1 font-mono text-2xl font-bold tabular-nums"
        style={{ color: tone ?? "var(--foreground)" }}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

/**
 * The equity curve in R. Drawn as a plain SVG path rather than a chart
 * library: it is one series with no axes to speak of, and the point is the
 * shape, not the readings.
 */
function Curve({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const width = 100;
  const height = 32;
  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const y = (value: number) => height - ((value - min) / span) * height;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${y(p)}`).join(" ");
  const last = points[points.length - 1] ?? 0;
  const colour = last >= 0 ? "#2fbf71" : "#d9534f";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-16 w-full"
      aria-hidden
    >
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={colour} opacity="0.12" />
      <path
        d={path}
        fill="none"
        stroke={colour}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      {/* The zero line, so a curve below water reads as below water. */}
      <line
        x1="0"
        x2={width}
        y1={y(0)}
        y2={y(0)}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.25"
        vectorEffect="non-scaling-stroke"
        className="text-muted-foreground"
      />
    </svg>
  );
}

export function PerformancePanel({
  performance,
  signals,
}: {
  performance: EzyAiPerformance;
  signals: EzyAiSignal[];
}) {
  const { t } = useTranslation();
  const winRate = useCountUp(performance.winRate, 900);
  const total = useCountUp(performance.total, 900);

  if (performance.total === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t("ezyai_sig_history_empty")}
      </p>
    );
  }

  const streak =
    performance.streak.kind === null
      ? "—"
      : `${performance.streak.count} ${t(
          performance.streak.kind === "win" ? "ezyai_sig_streak_wins" : "ezyai_sig_streak_losses",
        )}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label={t("ezyai_sig_winrate")}
          value={`${winRate}%`}
          tone={performance.winRate >= 50 ? "#2fbf71" : "#d9534f"}
          sub={t("ezyai_sig_winrate_note")
            .replace("{wins}", String(performance.wins))
            .replace("{losses}", String(performance.losses))}
        />
        <Metric
          label={t("ezyai_sig_total_r")}
          value={signedR(performance.totalR)}
          tone={performance.totalR >= 0 ? "#2fbf71" : "#d9534f"}
          sub={t("ezyai_sig_avg_r").replace("{value}", signedR(performance.avgR))}
        />
        <Metric
          label={t("ezyai_sig_closed")}
          value={String(total)}
          sub={t("ezyai_sig_be_note").replace("{count}", String(performance.breakEven))}
        />
        <Metric
          label={t("ezyai_sig_streak")}
          value={streak}
          tone={
            performance.streak.kind === "win"
              ? "#2fbf71"
              : performance.streak.kind === "loss"
                ? "#d9534f"
                : undefined
          }
          sub={t("ezyai_sig_best_worst")
            .replace("{best}", signedR(performance.bestR))
            .replace("{worst}", signedR(performance.worstR))}
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">{t("ezyai_sig_curve")}</h3>
        <p className="text-xs text-muted-foreground">{t("ezyai_sig_curve_note")}</p>
        <div className="mt-3">
          <Curve points={performance.curve} />
        </div>
      </section>

      {performance.bySymbol.length > 1 ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">{t("ezyai_sig_by_pair")}</h3>
          <div className="mt-3 space-y-2">
            {performance.bySymbol.map((row) => (
              <div key={row.symbol} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 font-semibold text-foreground">{row.symbol}</span>
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#3a403c]">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${row.winRate}%`,
                      background: row.winRate >= 50 ? "#2fbf71" : "#d9534f",
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {row.winRate}%
                </span>
                <span
                  className="w-16 shrink-0 text-right font-mono text-xs tabular-nums"
                  style={{ color: row.totalR >= 0 ? "#2fbf71" : "#d9534f" }}
                >
                  {signedR(row.totalR)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">{t("ezyai_sig_results")}</h3>
        <div className="no-scrollbar mt-3 max-h-[26rem] overflow-y-auto">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border py-2.5 first:border-t-0"
            >
              <span className="w-20 shrink-0 text-sm font-semibold text-foreground">
                {signal.symbol}
              </span>
              <span
                className={`w-10 shrink-0 text-xs font-bold uppercase ${
                  signal.direction === "buy" ? "text-primary" : "text-destructive"
                }`}
              >
                {signal.direction}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {signal.setup ?? signal.timeframe ?? ""}
              </span>
              <span
                className="w-14 shrink-0 text-right font-mono text-xs font-semibold tabular-nums"
                style={{ color: STATUS_COLOR[signal.status] }}
              >
                {signedR(signal.resultR)}
              </span>
              <StatusFlag status={signal.status} />
              <span className="w-24 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                {signal.closedAt ? formatLocalTime(new Date(signal.closedAt)) : ""}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
