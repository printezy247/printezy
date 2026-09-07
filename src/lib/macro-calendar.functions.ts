// Live economic calendar for /macro.
//
// Two providers, tried in order:
//
//   1. TradingView's public economic-calendar endpoint — the one its own
//      calendar widget calls. It carries the released number ("actual")
//      alongside forecast and previous, which is what the card wants.
//   2. ForexFactory's weekly JSON feed. It is forward-looking: it publishes
//      forecast and previous but never an actual, not even for events that
//      were released hours ago (verified against the live payload — the key
//      is absent on every event, past ones included).
//
// Whichever answers first supplies the whole day. Rows are never stitched
// across providers, so a row's three numbers always come from one source and
// cannot disagree with each other. Each provider's raw payload is cached in
// macro_calendar_cache for an hour and served from there; when a provider is
// down its last good copy is used, so the card degrades to "stale" rather
// than "empty".
import { createServerFn } from "@tanstack/react-start";
import type { Json } from "@/integrations/supabase/types";
import type { CalendarRow, Impact } from "@/lib/macro-desk";

const TV_URL = "https://economic-calendar.tradingview.com/events";
const TV_CACHE_KEY = "tv_calendar";
const FF_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const FF_CACHE_KEY = "ff_thisweek";
const FRESH_MS = 60 * 60 * 1000;

/** The majors ForexFactory covers, so both providers show the same desk. */
const TV_COUNTRIES = "US,EU,JP,GB,CH,AU,CA,NZ,CN";
const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  EU: "EUR",
  JP: "JPY",
  GB: "GBP",
  CH: "CHF",
  AU: "AUD",
  CA: "CAD",
  NZ: "NZD",
  CN: "CNY",
};

type FfEvent = {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
};

type TvEvent = {
  title?: string;
  indicator?: string;
  country?: string;
  currency?: string;
  date?: string;
  importance?: number;
  unit?: string;
  scale?: string;
  actual?: number | string | null;
  forecast?: number | string | null;
  previous?: number | string | null;
};

/** A row plus the New York day it belongs to, before grouping. */
type DayRow = CalendarRow & { day: string };

export type EconomicCalendar = {
  /** New York date ("YYYY-MM-DD") the rows belong to; null when nothing is available. */
  day: string | null;
  isToday: boolean;
  rows: CalendarRow[];
  /** Provider the rows came from, for the footer credit; null when none answered. */
  source: string | null;
  /** When the feed was last fetched; null when it has never loaded. */
  updatedAt: string | null;
};

const FF_IMPACT: Record<string, Impact> = {
  high: "high",
  medium: "medium",
  low: "low",
  holiday: "low",
};

/** TradingView grades importance as 1 / 0 / -1. */
const TV_IMPACT: Record<string, Impact> = {
  "1": "high",
  "0": "medium",
  "-1": "low",
};

const NY_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const NY_STAMP = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function nyToday(now = new Date()): string {
  return NY_DAY.format(now);
}

/** UTC instant to New York day + wall clock, which is what CalendarRow holds. */
function toNewYork(iso: string): { day: string; time: string } | null {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const part: Record<string, string> = {};
  for (const p of NY_STAMP.formatToParts(at)) part[p.type] = p.value;
  if (!part.year || !part.month || !part.day || !part.hour || !part.minute) return null;
  return { day: `${part.year}-${part.month}-${part.day}`, time: `${part.hour}:${part.minute}` };
}

/**
 * TradingView sends numbers, not display strings: 237000 rather than "237K",
 * with the percent sign in `unit` and — when it has already scaled the value
 * itself — the magnitude letter in `scale`. Abbreviate anything still in full
 * so the column reads the way ForexFactory prints it.
 */
function formatValue(value: unknown, unit: string, scale: string): string {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(n)) return "—";

  let scaled = n;
  let magnitude = "";
  const size = Math.abs(n);
  if (size >= 1e12) {
    scaled = n / 1e12;
    magnitude = "T";
  } else if (size >= 1e9) {
    scaled = n / 1e9;
    magnitude = "B";
  } else if (size >= 1e6) {
    scaled = n / 1e6;
    magnitude = "M";
  } else if (size >= 1e3) {
    scaled = n / 1e3;
    magnitude = "K";
  } else {
    magnitude = scale.trim().toUpperCase();
  }

  const text = scaled.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (unit === "%") return `${text}${magnitude}%`;
  return unit ? `${text}${magnitude} ${unit}` : `${text}${magnitude}`;
}

/* ------------------------------------------------------------------ */
/* Cache                                                               */
/* ------------------------------------------------------------------ */

type Payload = { payload: unknown; fetchedAt: string };

/**
 * Serve the cached payload while it is fresh, otherwise refetch and store it.
 * A failed fetch falls back to the stale copy rather than to nothing.
 */
async function loadProvider(key: string, fetcher: () => Promise<unknown>): Promise<Payload | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cached } = await supabaseAdmin
    .from("macro_calendar_cache")
    .select("payload, fetched_at")
    .eq("key", key)
    .maybeSingle();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < FRESH_MS) {
    return { payload: cached.payload, fetchedAt: cached.fetched_at };
  }

  try {
    const payload = await fetcher();
    const fetchedAt = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("macro_calendar_cache")
      .upsert({ key, payload: payload as Json, fetched_at: fetchedAt });
    if (error) console.error(`[macro] ${key} cache write failed`, error);
    return { payload, fetchedAt };
  } catch (error) {
    console.error(`[macro] ${key} feed failed`, error);
    return cached ? { payload: cached.payload, fetchedAt: cached.fetched_at } : null;
  }
}

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

async function fetchTradingView(): Promise<unknown> {
  // Start a day back so the New York day in progress is fully covered even
  // when the server clock has already rolled over into the next UTC day.
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000);
  const url = `${TV_URL}?from=${from.toISOString()}&to=${to.toISOString()}&countries=${TV_COUNTRIES}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      accept: "application/json",
      // The endpoint backs the public calendar widget and answers for its origin.
      origin: "https://www.tradingview.com",
      referer: "https://www.tradingview.com/",
      "user-agent": "EzyMapALGO/1.0 (+https://printezy.money)",
    },
  });
  if (!res.ok) throw new Error(`tradingview responded ${res.status}`);
  const body = (await res.json()) as { result?: unknown };
  if (!Array.isArray(body?.result)) throw new Error("tradingview payload carries no result list");
  return body;
}

function normalizeTradingView(payload: unknown): DayRow[] {
  const list = (payload as { result?: unknown } | null)?.result;
  if (!Array.isArray(list)) return [];

  const rows: DayRow[] = [];
  for (const raw of list as TvEvent[]) {
    const at = toNewYork(typeof raw.date === "string" ? raw.date : "");
    if (!at) continue;
    const impact = TV_IMPACT[String(raw.importance ?? "")];
    if (!impact) continue;

    const unit = typeof raw.unit === "string" ? raw.unit : "";
    const scale = typeof raw.scale === "string" ? raw.scale : "";
    const country = (raw.country ?? "").trim().toUpperCase();
    rows.push({
      day: at.day,
      nyTime: at.time,
      currency:
        ((raw.currency ?? "").trim() || COUNTRY_CURRENCY[country] || country).toUpperCase() || "—",
      event: (raw.title ?? raw.indicator ?? "").trim() || "—",
      impact,
      actual: formatValue(raw.actual, unit, scale),
      forecast: formatValue(raw.forecast, unit, scale),
      previous: formatValue(raw.previous, unit, scale),
    });
  }
  return rows;
}

async function fetchForexFactory(): Promise<unknown> {
  const res = await fetch(FF_URL, {
    signal: AbortSignal.timeout(8000),
    headers: {
      accept: "application/json",
      "user-agent": "EzyMapALGO/1.0 (+https://printezy.money)",
    },
  });
  if (!res.ok) throw new Error(`forexfactory responded ${res.status}`);
  const events = (await res.json()) as unknown;
  if (!Array.isArray(events)) throw new Error("forexfactory payload is not a list");
  return events;
}

function normalizeForexFactory(payload: unknown): DayRow[] {
  if (!Array.isArray(payload)) return [];

  const rows: DayRow[] = [];
  for (const raw of payload as FfEvent[]) {
    // Times already carry the New York offset, so the wall-clock part is NY.
    const date = typeof raw.date === "string" ? raw.date : "";
    const day = date.slice(0, 10);
    const time = date.slice(11, 16);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    const impact = FF_IMPACT[(raw.impact ?? "").toLowerCase()];
    if (!impact) continue;

    rows.push({
      day,
      nyTime: /^\d{2}:\d{2}$/.test(time) ? time : "—",
      currency: (raw.country ?? "").trim().toUpperCase() || "—",
      event: (raw.title ?? "").trim() || "—",
      impact,
      // This feed has no actuals at all; the column stays empty on it.
      actual: "—",
      forecast: (raw.forecast ?? "").trim() || "—",
      previous: (raw.previous ?? "").trim() || "—",
    });
  }
  return rows;
}

async function loadCalendar(): Promise<{
  rows: DayRow[];
  source: string;
  fetchedAt: string;
} | null> {
  const providers = [
    {
      key: TV_CACHE_KEY,
      name: "TradingView",
      fetcher: fetchTradingView,
      parse: normalizeTradingView,
    },
    {
      key: FF_CACHE_KEY,
      name: "ForexFactory",
      fetcher: fetchForexFactory,
      parse: normalizeForexFactory,
    },
  ];

  for (const provider of providers) {
    const loaded = await loadProvider(provider.key, provider.fetcher);
    if (!loaded) continue;
    const rows = provider.parse(loaded.payload);
    if (rows.length) return { rows, source: provider.name, fetchedAt: loaded.fetchedAt };
  }
  return null;
}

/**
 * Today's releases (New York day). When today has none left in the feed,
 * the next day that does is returned instead and `isToday` is false.
 */
export const getEconomicCalendar = createServerFn({ method: "GET" }).handler(
  async (): Promise<EconomicCalendar> => {
    const feed = await loadCalendar();
    if (!feed) return { day: null, isToday: false, rows: [], source: null, updatedAt: null };

    const today = nyToday();
    const byDay = new Map<string, CalendarRow[]>();
    for (const { day, ...row } of feed.rows) {
      if (day < today) continue;
      const rows = byDay.get(day) ?? [];
      rows.push(row);
      byDay.set(day, rows);
    }

    const day = [...byDay.keys()].sort()[0] ?? null;
    const rows = day ? [...byDay.get(day)!].sort((a, b) => a.nyTime.localeCompare(b.nyTime)) : [];
    return { day, isToday: day === today, rows, source: feed.source, updatedAt: feed.fetchedAt };
  },
);
