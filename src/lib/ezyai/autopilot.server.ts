import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { advance, evaluate, PROFILES, type StrategyProfile } from "./autopilot";
import { loadCandles, WATCHLIST, type WatchedInstrument } from "./market.server";
import { pushSignal } from "./signals.server";
import type { Candle } from "./indicators";

/**
 * The website's own autopilot, run end to end.
 *
 * This is the piece that replaces the Telegram bot's push: instead of another
 * machine calling in over HTTP with a shared secret, the site reads the same
 * feeds, applies its own strategy and writes through the same `pushSignal` the
 * bridge used. The board, the cards and the performance page are untouched —
 * they were never coupled to where a signal came from.
 *
 * Every run does three things per instrument, in this order:
 *   1. Advance whatever is already open, so a trade that hit its target closes
 *      before anything new is considered.
 *   2. Consider a new setup, but only when nothing is live on that symbol.
 *   3. Record what happened, so an empty board is never ambiguous again.
 */

/**
 * The shortest gap any profile asks for. A pass is worth starting only when at
 * least one profile is due; each then re-checks its own cadence.
 */
const MIN_RUN_GAP_MS = Math.min(...PROFILES.map((p) => p.minGapMs));

export type AutopilotRun = {
  ran: boolean;
  reason?: string;
  scanned: number;
  opened: number;
  advanced: number;
  closed: number;
  errors: number;
  detail: string[];
};

const idle = (reason: string): AutopilotRun => ({
  ran: false,
  reason,
  scanned: 0,
  opened: 0,
  advanced: 0,
  closed: 0,
  errors: 0,
  detail: [],
});

/**
 * A signal's id is its symbol plus the bar it was opened on, so a run that
 * re-examines the same bar updates the card it already made instead of stacking
 * a second one. Idempotence lives in the key, not in a lock.
 */
function externalId(profile: StrategyProfile, symbol: string, barTime: number): string {
  return `auto-${profile.name}-${symbol}-${barTime}`;
}

type OpenRow = {
  external_id: string;
  symbol: string;
  direction: "buy" | "sell";
  status: "pending" | "running";
  entry_low: number | null;
  entry_high: number | null;
  stop_price: number | null;
  tp1: number | null;
  opened_at: string;
};

async function openSignals(): Promise<OpenRow[]> {
  const { data, error } = await supabaseAdmin
    .from("ezyai_signals")
    .select(
      "external_id, symbol, direction, status, entry_low, entry_high, stop_price, tp1, opened_at",
    )
    .in("status", ["pending", "running"]);
  if (error) {
    console.error("[autopilot] could not read open signals", error.message);
    return [];
  }
  return (data ?? []) as unknown as OpenRow[];
}

/** When the last pass started, or 0 when there has never been one. */
async function lastRunAt(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("ezyai_autopilot_runs")
    .select("started_at")
    .order("started_at", { ascending: false })
    .limit(1);
  if (error) {
    // Never let a bookkeeping failure stop the desk from running.
    console.error("[autopilot] could not read the run log", error.message);
    return 0;
  }
  const last = (data ?? [])[0] as { started_at: string } | undefined;
  return last ? new Date(last.started_at).getTime() : 0;
}

async function handleInstrument(
  instrument: WatchedInstrument,
  profile: StrategyProfile,
  candles: Candle[],
  open: OpenRow[],
  run: AutopilotRun,
): Promise<void> {
  const tag = `${instrument.symbol} ${profile.name}`;
  if (candles.length < profile.minBars) {
    run.errors += 1;
    run.detail.push(`${tag}: only ${candles.length} bars`);
    return;
  }
  run.scanned += 1;

  // One live signal per instrument PER PROFILE: a scalp and a swing on the same
  // pair are different trades with different lives, and collapsing them would
  // hide one behind the other.
  const prefix = `auto-${profile.name}-${instrument.symbol}-`;
  const live = open.find((row) => row.external_id.startsWith(prefix));

  // 1 — advance what is already open
  if (live) {
    const since = candles.filter((c) => c.time >= new Date(live.opened_at).getTime());
    const step = advance(
      {
        direction: live.direction,
        status: live.status,
        entryLow: live.entry_low,
        entryHigh: live.entry_high,
        stopPrice: live.stop_price,
        tp1: live.tp1,
      },
      since.length ? since : candles.slice(-1),
      instrument,
    );
    if (step) {
      const result = await pushSignal({
        external_id: live.external_id,
        status: step.status,
        last_price: step.lastPrice,
        ...(step.resultR !== null ? { result_r: step.resultR } : {}),
        ...(step.resultPips !== null ? { result_pips: step.resultPips } : {}),
      });
      if (!result.ok) {
        run.errors += 1;
        run.detail.push(`${tag}: advance failed`);
      } else if (step.status === "tp" || step.status === "sl") {
        run.closed += 1;
        run.detail.push(`${tag}: closed ${step.status} at ${step.resultR}R`);
      } else {
        run.advanced += 1;
      }
    }
    return;
  }

  // 2 — consider a new one
  const setup = evaluate(candles, instrument, profile);
  if (!setup) return;

  const bar = candles[candles.length - 1];
  const result = await pushSignal({
    external_id: externalId(profile, instrument.symbol, bar.time),
    symbol: instrument.symbol,
    direction: setup.direction,
    status: "pending",
    setup: profile.label,
    timeframe: profile.timeframe,
    entry_low: setup.entryLow,
    entry_high: setup.entryHigh,
    stop_price: setup.stopPrice,
    tp1: setup.tp1,
    tp2: setup.tp2,
    rr: setup.rr,
    setup_score: setup.setupScore,
    last_price: bar.close,
    note: setup.reasons.join(" · "),
    opened_at: new Date(bar.time).toISOString(),
  });

  if (result.ok) {
    run.opened += 1;
    run.detail.push(`${tag}: opened ${setup.direction} @ ${setup.setupScore}/100`);
  } else {
    run.errors += 1;
    run.detail.push(`${tag}: open failed`);
  }
}

/**
 * Run the desk once.
 *
 * `force` skips the throttle, for the manual trigger. Nothing here throws: the
 * caller is a page load, and a market feed having a bad minute must never be
 * able to take the board — or the page — down with it.
 */
export async function runAutopilot(force = false): Promise<AutopilotRun> {
  try {
    const lastRunMs = await lastRunAt();
    if (!force && lastRunMs && Date.now() - lastRunMs < MIN_RUN_GAP_MS) return idle("throttled");

    const run: AutopilotRun = {
      ran: true,
      scanned: 0,
      opened: 0,
      advanced: 0,
      closed: 0,
      errors: 0,
      detail: [],
    };

    const startedAt = new Date().toISOString();
    const open = await openSignals();

    // The feeds are read in parallel and the decisions are made afterwards.
    // Sequentially it would be eight round trips deep — and since a page load
    // is what triggers this, that latency lands on a reader waiting for the
    // board. Parallel puts the whole scan inside one timeout instead of eight.
    // Only the profiles that are actually due. A daily-bar strategy re-examined
    // every five minutes cannot find anything new; it just spends a network
    // call to reach the same answer.
    const due = force ? PROFILES : PROFILES.filter((p) => Date.now() - lastRunMs >= p.minGapMs);
    if (!due.length) return idle("no profile due");
    run.detail.push(`profiles: ${due.map((p) => p.name).join(", ")}`);

    const jobs = due.flatMap((profile) => WATCHLIST.map((instrument) => ({ profile, instrument })));

    const fetched = await Promise.all(
      jobs.map(async ({ profile, instrument }) => {
        try {
          return { profile, instrument, candles: await loadCandles(instrument, profile.timeframe) };
        } catch (error) {
          console.error(`[autopilot] ${instrument.symbol} ${profile.name} feed threw`, error);
          return { profile, instrument, candles: [] as Candle[] };
        }
      }),
    );

    // Decisions stay sequential: they are database writes, they are fast, and
    // ordering them keeps the run log readable.
    for (const { profile, instrument, candles } of fetched) {
      await handleInstrument(instrument, profile, candles, open, run);
    }

    const { error } = await supabaseAdmin.from("ezyai_autopilot_runs").insert({
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      scanned: run.scanned,
      opened: run.opened,
      advanced: run.advanced,
      closed: run.closed,
      errors: run.errors,
      detail: run.detail.join(" | ").slice(0, 2000) || null,
    } as never);
    if (error) console.error("[autopilot] could not write the run log", error.message);

    return run;
  } catch (error) {
    console.error("[autopilot] run failed", error);
    return idle("run threw");
  }
}

/** The last few runs, for the diagnose endpoint. */
export async function recentRuns(limit = 5) {
  const { data, error } = await supabaseAdmin
    .from("ezyai_autopilot_runs")
    .select("started_at, finished_at, scanned, opened, advanced, closed, errors, detail")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[autopilot] could not read runs", error.message);
    return [];
  }
  return data ?? [];
}
