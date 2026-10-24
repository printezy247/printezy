/**
 * One card per call, not one per subscriber.
 *
 * The bot pushes every live signal to the board — autopilot and watch alerts
 * alike — and a watch fires per chat, so two PRO users watching the same pair
 * in the same style are the same call arriving twice under two external_ids.
 * The board must not fill up with copies, so a new push that matches a live
 * card folds into it. This is the matcher: pure, no database, the query
 * around it stays thin.
 *
 * Match = same symbol + same direction + same setup label ("Intraday ·
 * Normal risk · 15m", which carries style and risk mode) opened within one
 * day of each other. Different styles are genuinely different cards (a scalp
 * era pair could run intraday and swing together) and opposite directions
 * are different opinions, so neither folds.
 */

const WINDOW_MS = 24 * 60 * 60 * 1000;
const LIVE = new Set(["pending", "running"]);

/** A live board row, trimmed to everything duplication cares about. */
export type LiveLike = {
  symbol: string;
  direction: string;
  setup: string | null;
  status: string;
  openedAt: string;
};

/** The fields of a new push that a duplicate is judged on. */
export type IncomingPush = {
  symbol: string;
  direction?: string | null;
  setup?: string | null;
  openedAt?: string | null;
};

function withinWindow(a: string, b: string): boolean {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return Math.abs(ta - tb) <= WINDOW_MS;
}

function norm(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  return trimmed ? trimmed : null;
}

/**
 * The live row this new push duplicates, or null. `now` is injectable so the
 * clock is testable; an incoming push without an open time is judged as
 * happening now.
 */
export function findLiveDuplicate<T extends LiveLike>(
  rows: readonly T[],
  incoming: IncomingPush,
  now = new Date().toISOString(),
): T | null {
  const direction = norm(incoming.direction)?.toLowerCase();
  // Without a direction there is nothing to match on — do not guess.
  if (!direction) return null;
  const symbol = incoming.symbol.trim().toUpperCase();
  const setup = norm(incoming.setup);
  const openedAt = incoming.openedAt ?? now;
  for (const row of rows) {
    if (!LIVE.has(row.status)) continue;
    if (row.symbol.trim().toUpperCase() !== symbol) continue;
    if (row.direction.trim().toLowerCase() !== direction) continue;
    if (norm(row.setup) !== setup) continue;
    if (!withinWindow(row.openedAt, openedAt)) continue;
    return row;
  }
  return null;
}
