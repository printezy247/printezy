// Live economic calendar for /macro, from ForexFactory's public weekly feed.
//
// The feed is one JSON file for the whole week (times carry the New York
// offset, so the wall-clock part is already NY time). It is cached in
// macro_calendar_cache for an hour and served from there; when the feed is
// down the last good copy is used, so the card degrades to "stale" rather
// than "empty".
import { createServerFn } from "@tanstack/react-start";
import type { Json } from "@/integrations/supabase/types";
import type { CalendarRow, Impact } from "@/lib/macro-desk";

const FEED_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const CACHE_KEY = "ff_thisweek";
const FRESH_MS = 60 * 60 * 1000;

type FeedEvent = {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
};

export type EconomicCalendar = {
  /** New York date ("YYYY-MM-DD") the rows belong to; null when nothing is available. */
  day: string | null;
  isToday: boolean;
  rows: CalendarRow[];
  /** When the feed was last fetched; null when it has never loaded. */
  updatedAt: string | null;
};

const IMPACT: Record<string, Impact> = {
  high: "high",
  medium: "medium",
  low: "low",
  holiday: "low",
};

function nyToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

async function loadFeed(): Promise<{ events: FeedEvent[]; fetchedAt: string } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cached } = await supabaseAdmin
    .from("macro_calendar_cache")
    .select("payload, fetched_at")
    .eq("key", CACHE_KEY)
    .maybeSingle();

  const fresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < FRESH_MS;
  if (fresh) return { events: cached.payload as FeedEvent[], fetchedAt: cached.fetched_at };

  try {
    const res = await fetch(FEED_URL, {
      signal: AbortSignal.timeout(8000),
      headers: {
        accept: "application/json",
        "user-agent": "EzyMapALGO/1.0 (+https://printezy.money)",
      },
    });
    if (!res.ok) throw new Error(`feed responded ${res.status}`);
    const events = (await res.json()) as unknown;
    if (!Array.isArray(events)) throw new Error("feed is not a list");
    const fetchedAt = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("macro_calendar_cache")
      .upsert({ key: CACHE_KEY, payload: events as Json, fetched_at: fetchedAt });
    if (error) console.error("[macro] calendar cache write failed", error);
    return { events: events as FeedEvent[], fetchedAt };
  } catch (error) {
    console.error("[macro] calendar feed failed", error);
    if (cached) return { events: cached.payload as FeedEvent[], fetchedAt: cached.fetched_at };
    return null;
  }
}

/**
 * Today's releases (New York day). When today has none left in the feed,
 * the next day that does is returned instead and `isToday` is false.
 */
export const getEconomicCalendar = createServerFn({ method: "GET" }).handler(
  async (): Promise<EconomicCalendar> => {
    const feed = await loadFeed();
    if (!feed) return { day: null, isToday: false, rows: [], updatedAt: null };

    const today = nyToday();
    const byDay = new Map<string, CalendarRow[]>();
    for (const e of feed.events) {
      const date = typeof e.date === "string" ? e.date : "";
      const day = date.slice(0, 10);
      const time = date.slice(11, 16);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < today) continue;
      const impact = IMPACT[(e.impact ?? "").toLowerCase()];
      if (!impact) continue;
      const rows = byDay.get(day) ?? [];
      rows.push({
        nyTime: /^\d{2}:\d{2}$/.test(time) ? time : "—",
        currency: (e.country ?? "").trim().toUpperCase() || "—",
        event: (e.title ?? "").trim() || "—",
        impact,
        forecast: (e.forecast ?? "").trim() || "—",
        previous: (e.previous ?? "").trim() || "—",
      });
      byDay.set(day, rows);
    }

    const day = [...byDay.keys()].sort()[0] ?? null;
    const rows = day ? [...byDay.get(day)!].sort((a, b) => a.nyTime.localeCompare(b.nyTime)) : [];
    return { day, isToday: day === today, rows, updatedAt: feed.fetchedAt };
  },
);
