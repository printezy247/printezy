// Autopilot signals from the admin's EzyAI account, as the website sees them.
//
// Isomorphic on purpose: the types, the status vocabulary and the arithmetic
// all run in the browser (the cards animate against them) and on the server
// (the ingest endpoint validates against them). Nothing here touches the
// database — that lives in signals.server.ts.
//
// The bot is the only writer. It opens a signal, ticks the price while the
// trade is live, and closes it at target, break-even or stop. The website
// never decides an outcome; it only renders what the bot reports.

/**
 * `pending` — published, price has not reached the entry zone yet.
 * `running` — filled and live.
 * `tp` / `be` / `sl` — closed at target, break-even or stop.
 * `cancelled` — withdrawn before filling; never counted in performance.
 */
export const SIGNAL_STATUSES = ["pending", "running", "tp", "be", "sl", "cancelled"] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];

export const SIGNAL_DIRECTIONS = ["buy", "sell"] as const;
export type SignalDirection = (typeof SIGNAL_DIRECTIONS)[number];

/** A card stays on the live board until the trade actually finishes. */
export const LIVE_STATUSES: SignalStatus[] = ["pending", "running"];
export const CLOSED_STATUSES: SignalStatus[] = ["tp", "be", "sl"];

/** One colour per state, shared by the flag, the rail and the result figure. */
export const STATUS_COLOR: Record<SignalStatus, string> = {
  pending: "#c9a13a",
  running: "#2fbf71",
  tp: "#2fbf71",
  be: "#8b948f",
  sl: "#d9534f",
  cancelled: "#8b948f",
};

export function isLive(status: SignalStatus): boolean {
  return LIVE_STATUSES.includes(status);
}

export type EzyAiSignal = {
  id: string;
  symbol: string;
  direction: SignalDirection;
  status: SignalStatus;
  /** Free text naming the pattern, e.g. "London continuation". */
  setup: string | null;
  timeframe: string | null;
  entryLow: number | null;
  entryHigh: number | null;
  /** Where it actually filled, once it did. */
  entryFill: number | null;
  stopPrice: number | null;
  tp1: number | null;
  tp2: number | null;
  /** Reward per unit of risk, as planned: 2.4 renders as "1 : 2.4". */
  rr: number | null;
  /** The bot's own confluence score, 0-100. */
  setupScore: number | null;
  /** Latest price the bot reported, which drives the progress bar. */
  lastPrice: number | null;
  resultPips: number | null;
  /** Realised R multiple: +2.4 on a target, -1 on a stop. */
  resultR: number | null;
  note: string | null;
  openedAt: string;
  closedAt: string | null;
  updatedAt: string;
};

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

/**
 * Where the trade sits on its own journey, as a percentage of the stop → target
 * span: 0 is the stop, 100 is the first target, and the entry sits somewhere
 * between. Both directions map onto the same left-to-right scale, so a card
 * always reads "further right is better" whether it is a buy or a sell.
 *
 * Null when the levels needed to place it are missing — the card then shows an
 * indeterminate bar rather than a made-up position.
 */
export function progressPercent(
  price: number | null | undefined,
  stop: number | null | undefined,
  target: number | null | undefined,
  direction: SignalDirection,
): number | null {
  if (price == null || stop == null || target == null) return null;
  const span = direction === "buy" ? target - stop : stop - target;
  if (!Number.isFinite(span) || span <= 0) return null;
  const travelled = direction === "buy" ? price - stop : stop - price;
  return Math.max(0, Math.min(100, (travelled / span) * 100));
}

/** Midpoint of the entry zone, or whichever single bound exists. */
export function entryMid(signal: {
  entryLow: number | null;
  entryHigh: number | null;
  entryFill: number | null;
}): number | null {
  if (signal.entryFill != null) return signal.entryFill;
  if (signal.entryLow != null && signal.entryHigh != null) {
    return (signal.entryLow + signal.entryHigh) / 2;
  }
  return signal.entryLow ?? signal.entryHigh ?? null;
}

/**
 * Live profit in R, from the last reported price. This is the number that
 * makes a running card feel alive; it is deliberately derived rather than
 * stored, so a stale row can never show a stale profit.
 */
export function liveR(signal: EzyAiSignal): number | null {
  const entry = entryMid(signal);
  if (entry == null || signal.lastPrice == null || signal.stopPrice == null) return null;
  const risk = Math.abs(entry - signal.stopPrice);
  if (risk <= 0) return null;
  const move = signal.direction === "buy" ? signal.lastPrice - entry : entry - signal.lastPrice;
  return move / risk;
}

/* ------------------------------------------------------------------ */
/* Performance                                                         */
/* ------------------------------------------------------------------ */

export type SymbolRecord = {
  symbol: string;
  total: number;
  wins: number;
  winRate: number;
  totalR: number;
};

export type EzyAiPerformance = {
  /** Closed signals, break-even included. Cancelled ones never count. */
  total: number;
  wins: number;
  losses: number;
  breakEven: number;
  /**
   * Wins over wins + losses. Break-even is excluded from the denominator
   * rather than counted as half a win, so the number cannot be flattered by
   * moving stops to entry.
   */
  winRate: number;
  totalR: number;
  avgR: number;
  bestR: number | null;
  worstR: number | null;
  /** The run the desk is on right now, counted from the newest close back. */
  streak: { kind: "win" | "loss" | null; count: number };
  /** Cumulative R, oldest close first — the equity curve. */
  curve: number[];
  bySymbol: SymbolRecord[];
};

const EMPTY: EzyAiPerformance = {
  total: 0,
  wins: 0,
  losses: 0,
  breakEven: 0,
  winRate: 0,
  totalR: 0,
  avgR: 0,
  bestR: null,
  worstR: null,
  streak: { kind: null, count: 0 },
  curve: [],
  bySymbol: [],
};

const round = (value: number, places = 2) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

/**
 * Rolls closed signals up into the numbers the performance tab shows. Takes
 * them newest-first (the order the database returns) and reverses internally
 * for the curve, so callers never have to think about ordering.
 */
export function summarisePerformance(signals: EzyAiSignal[]): EzyAiPerformance {
  const closed = signals.filter((s) => CLOSED_STATUSES.includes(s.status));
  if (closed.length === 0) return EMPTY;

  const wins = closed.filter((s) => s.status === "tp").length;
  const losses = closed.filter((s) => s.status === "sl").length;
  const breakEven = closed.filter((s) => s.status === "be").length;
  const decided = wins + losses;

  const scored = closed.filter((s) => s.resultR != null).map((s) => s.resultR as number);
  const totalR = scored.reduce((sum, r) => sum + r, 0);

  // Newest first on the way in; the streak reads forward from the newest.
  let streakKind: "win" | "loss" | null = null;
  let streakCount = 0;
  for (const signal of closed) {
    const kind = signal.status === "tp" ? "win" : signal.status === "sl" ? "loss" : null;
    if (kind === null) break; // a break-even ends the run rather than extending it
    if (streakKind === null) streakKind = kind;
    else if (streakKind !== kind) break;
    streakCount += 1;
  }

  let running = 0;
  const curve = [...closed].reverse().map((s) => {
    running += s.resultR ?? 0;
    return round(running);
  });

  const bySymbol = new Map<
    string,
    { total: number; wins: number; decided: number; totalR: number }
  >();
  for (const signal of closed) {
    const row = bySymbol.get(signal.symbol) ?? { total: 0, wins: 0, decided: 0, totalR: 0 };
    row.total += 1;
    if (signal.status === "tp") {
      row.wins += 1;
      row.decided += 1;
    } else if (signal.status === "sl") {
      row.decided += 1;
    }
    row.totalR += signal.resultR ?? 0;
    bySymbol.set(signal.symbol, row);
  }

  return {
    total: closed.length,
    wins,
    losses,
    breakEven,
    winRate: decided === 0 ? 0 : Math.round((wins / decided) * 100),
    totalR: round(totalR),
    avgR: scored.length === 0 ? 0 : round(totalR / scored.length),
    bestR: scored.length === 0 ? null : round(Math.max(...scored)),
    worstR: scored.length === 0 ? null : round(Math.min(...scored)),
    streak: { kind: streakKind, count: streakCount },
    curve,
    bySymbol: [...bySymbol.entries()]
      .map(([symbol, row]) => ({
        symbol,
        total: row.total,
        wins: row.wins,
        winRate: row.decided === 0 ? 0 : Math.round((row.wins / row.decided) * 100),
        totalR: round(row.totalR),
      }))
      .sort((a, b) => b.total - a.total),
  };
}
