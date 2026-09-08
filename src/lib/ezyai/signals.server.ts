// Database access for the EzyAI autopilot signal board.
//
// The bot is the only writer, through /api/public/ezyai/signals. Its pushes
// come in three shapes and all three land here as one merge:
//
//   open   { external_id, symbol, direction, entry_low, ..., status: "pending" }
//   tick   { external_id, last_price }
//   close  { external_id, status: "tp", result_r: 2.4 }
//
// So every field except external_id is optional on an update, and a column
// absent from the payload keeps whatever it already had. The bot can retry a
// push after a crash without duplicating a card or double-counting a result.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  CLOSED_STATUSES,
  LIVE_STATUSES,
  SIGNAL_DIRECTIONS,
  SIGNAL_STATUSES,
  type EzyAiSignal,
  type SignalDirection,
  type SignalStatus,
} from "./signals";

const TABLE = "ezyai_signals";

const COLUMNS =
  "id, external_id, symbol, direction, status, setup, timeframe, entry_low, entry_high, " +
  "entry_fill, stop_price, tp1, tp2, rr, setup_score, last_price, result_pips, result_r, " +
  "note, opened_at, closed_at, updated_at";

type Row = {
  id: string;
  external_id: string;
  symbol: string;
  direction: string;
  status: string;
  setup: string | null;
  timeframe: string | null;
  entry_low: number | null;
  entry_high: number | null;
  entry_fill: number | null;
  stop_price: number | null;
  tp1: number | null;
  tp2: number | null;
  rr: number | null;
  setup_score: number | null;
  last_price: number | null;
  result_pips: number | null;
  result_r: number | null;
  note: string | null;
  opened_at: string;
  closed_at: string | null;
  updated_at: string;
};

function toSignal(row: Row): EzyAiSignal {
  return {
    id: row.id,
    symbol: row.symbol,
    direction: (SIGNAL_DIRECTIONS as readonly string[]).includes(row.direction)
      ? (row.direction as SignalDirection)
      : "buy",
    status: (SIGNAL_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as SignalStatus)
      : "pending",
    setup: row.setup,
    timeframe: row.timeframe,
    entryLow: row.entry_low,
    entryHigh: row.entry_high,
    entryFill: row.entry_fill,
    stopPrice: row.stop_price,
    tp1: row.tp1,
    tp2: row.tp2,
    rr: row.rr,
    setupScore: row.setup_score,
    lastPrice: row.last_price,
    resultPips: row.result_pips,
    resultR: row.result_r,
    note: row.note,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    updatedAt: row.updated_at,
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/** Everything still on the board: waiting to fill, or filled and running. */
export async function listLiveSignals(limit = 24): Promise<EzyAiSignal[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(COLUMNS)
    .in("status", LIVE_STATUSES)
    .order("opened_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[ezyai-signals] live lookup failed", error);
    return [];
  }
  return ((data ?? []) as unknown as Row[]).map(toSignal);
}

/** Finished trades, newest close first — the input to every performance number. */
export async function listClosedSignals(limit = 200): Promise<EzyAiSignal[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(COLUMNS)
    .in("status", CLOSED_STATUSES)
    .order("closed_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.error("[ezyai-signals] history lookup failed", error);
    return [];
  }
  return ((data ?? []) as unknown as Row[]).map(toSignal);
}

/* ------------------------------------------------------------------ */
/* Ingest                                                              */
/* ------------------------------------------------------------------ */

export type SignalPush = {
  external_id?: unknown;
  symbol?: unknown;
  direction?: unknown;
  status?: unknown;
  setup?: unknown;
  timeframe?: unknown;
  entry_low?: unknown;
  entry_high?: unknown;
  entry_fill?: unknown;
  stop_price?: unknown;
  tp1?: unknown;
  tp2?: unknown;
  rr?: unknown;
  setup_score?: unknown;
  last_price?: unknown;
  result_pips?: unknown;
  result_r?: unknown;
  note?: unknown;
  opened_at?: unknown;
  closed_at?: unknown;
};

export type PushResult = { ok: true; id: string; created: boolean } | { ok: false; error: string };

/** Finite number, or undefined so the column is left alone. Null clears it. */
function num(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function text(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return String(value).trim().slice(0, max) || null;
}

function timestamp(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const at = new Date(String(value));
  return Number.isNaN(at.getTime()) ? undefined : at.toISOString();
}

/**
 * Merge one push into the board. Returns a plain error string rather than
 * throwing, so a batch can report per-signal outcomes and the bot can retry
 * just the ones that failed.
 */
export async function pushSignal(payload: SignalPush): Promise<PushResult> {
  const externalId = text(payload.external_id, 120);
  if (!externalId) return { ok: false, error: "external_id is required" };

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from(TABLE)
    .select("id, status")
    .eq("external_id", externalId)
    .maybeSingle();
  if (lookupError) {
    console.error("[ezyai-signals] push lookup failed", lookupError);
    return { ok: false, error: "lookup failed" };
  }
  const known = existing as { id: string; status: string } | null;

  const symbol = text(payload.symbol, 32);
  if (!known && !symbol) return { ok: false, error: "symbol is required on a new signal" };

  const direction = text(payload.direction, 8)?.toLowerCase();
  if (direction && !(SIGNAL_DIRECTIONS as readonly string[]).includes(direction)) {
    return { ok: false, error: `direction must be one of ${SIGNAL_DIRECTIONS.join(", ")}` };
  }

  const status = text(payload.status, 16)?.toLowerCase();
  if (status && !(SIGNAL_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: `status must be one of ${SIGNAL_STATUSES.join(", ")}` };
  }

  const score = num(payload.setup_score);
  if (typeof score === "number" && (score < 0 || score > 100)) {
    return { ok: false, error: "setup_score must be between 0 and 100" };
  }

  const closedAt = timestamp(payload.closed_at);
  const nowIso = new Date().toISOString();
  const becomingClosed = status != null && (CLOSED_STATUSES as readonly string[]).includes(status);

  // Only send the keys the push actually carried, so an update leaves every
  // other column exactly as it was.
  const patch: Record<string, unknown> = { external_id: externalId, updated_at: nowIso };
  const set = (key: string, value: unknown) => {
    if (value !== undefined) patch[key] = value;
  };
  set("symbol", symbol?.toUpperCase());
  set("direction", direction);
  set("status", status);
  set("setup", text(payload.setup, 120));
  set("timeframe", text(payload.timeframe, 16));
  set("entry_low", num(payload.entry_low));
  set("entry_high", num(payload.entry_high));
  set("entry_fill", num(payload.entry_fill));
  set("stop_price", num(payload.stop_price));
  set("tp1", num(payload.tp1));
  set("tp2", num(payload.tp2));
  set("rr", num(payload.rr));
  set("setup_score", typeof score === "number" ? Math.round(score) : score);
  set("last_price", num(payload.last_price));
  set("result_pips", num(payload.result_pips));
  set("result_r", num(payload.result_r));
  set("note", text(payload.note, 400));
  set("opened_at", timestamp(payload.opened_at));
  set("closed_at", closedAt);

  // A close that forgets its timestamp still gets one, so the history can be
  // ordered and the streak counted.
  if (becomingClosed && closedAt === undefined) patch.closed_at = nowIso;

  // Deliberately not an upsert. Postgres builds the candidate row and checks
  // its NOT NULL columns *before* it notices the conflict, so an upsert of a
  // price tick — which carries no symbol — is rejected even though the row it
  // means to update already exists. Update-or-insert is the honest shape.
  if (known) {
    const { error } = await supabaseAdmin
      .from(TABLE)
      .update(patch as never)
      .eq("external_id", externalId);
    if (error) {
      console.error("[ezyai-signals] update failed", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: known.id, created: false };
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert(patch as never)
    .select("id")
    .maybeSingle();

  if (error) {
    // 23505 means another push created this signal between the lookup and the
    // insert. It exists now, so apply the payload as the update it should
    // have been rather than losing it.
    if (error.code === "23505") {
      const { data: raced, error: retryError } = await supabaseAdmin
        .from(TABLE)
        .update(patch as never)
        .eq("external_id", externalId)
        .select("id")
        .maybeSingle();
      if (retryError) {
        console.error("[ezyai-signals] push retry failed", retryError);
        return { ok: false, error: retryError.message };
      }
      return { ok: true, id: (raced as { id: string } | null)?.id ?? "", created: false };
    }
    console.error("[ezyai-signals] insert failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: (data as { id: string } | null)?.id ?? "", created: true };
}
