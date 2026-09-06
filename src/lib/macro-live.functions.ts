// Live desk numbers for /macro, read from the MacroTrader bot.
//
// The bot (printezy247/macro-trader-bot) computes central bank rates,
// recession odds, Fed speech tone and news sentiment and serves them at
// GET /api/desk behind a bearer key. Reading from there, rather than
// recomputing here, is what keeps the website and the Telegram bot showing
// the same numbers. Cached in macro_calendar_cache for a few hours; the last
// good copy is served when the bot is unreachable.
import { createServerFn } from "@tanstack/react-start";
import type { Json } from "@/integrations/supabase/types";

export type Stance = "hawkish" | "neutral" | "dovish";
export type ToneLabel = "hawkish" | "neutral" | "dovish";
export type SentimentLabel = "bullish" | "neutral" | "bearish";

export type BotDesk = {
  generated_at: string;
  central_banks: {
    key: string;
    name: string;
    short: string;
    flag: string;
    rate: string;
    rate_value: number;
    stance: Stance;
    next_meeting: string;
    next_meeting_date: string | null;
    as_of: string | null;
    source: string;
  }[];
  recession: {
    key: string;
    name: string;
    flag: string;
    probability: number;
    spread: number | null;
    indicator: string;
    as_of: string | null;
    source: string;
  }[];
  rate_decisions: { key: string; bank: string; date: string; iso: string }[];
  fed_tone: {
    score: number;
    label: ToneLabel;
    speech_count: number;
    history: { date: string; score: number }[];
    next_fomc: string | null;
  } | null;
  news_sentiment: {
    assets: Record<
      string,
      {
        score: number;
        label: SentimentLabel;
        article_count: number;
        history: { date: string; score: number }[];
      }
    >;
    aggregate: { score: number; label: SentimentLabel; history: { date: string; score: number }[] };
  } | null;
};

export type MacroLive = { desk: BotDesk; updatedAt: string } | null;

const CACHE_KEY = "bot_desk";
const FRESH_MS = 3 * 60 * 60 * 1000;

export const getMacroLive = createServerFn({ method: "GET" }).handler(
  async (): Promise<MacroLive> => {
    const base = (process.env.MACRO_BOT_URL ?? "").trim().replace(/\/+$/, "");
    const key = (process.env.MACRO_BOT_KEY ?? "").trim();
    if (!base || !key) return null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cached } = await supabaseAdmin
      .from("macro_calendar_cache")
      .select("payload, fetched_at")
      .eq("key", CACHE_KEY)
      .maybeSingle();

    const fresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < FRESH_MS;
    if (fresh) return { desk: cached.payload as unknown as BotDesk, updatedAt: cached.fetched_at };

    try {
      const res = await fetch(`${base}/api/desk`, {
        headers: { authorization: `Bearer ${key}`, accept: "application/json" },
        // The bot's first build of the day pulls several public series; give it room.
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`bot responded ${res.status}`);
      const desk = (await res.json()) as BotDesk;
      if (!Array.isArray(desk?.central_banks) || !Array.isArray(desk?.recession)) {
        throw new Error("unexpected desk payload");
      }
      const fetchedAt = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from("macro_calendar_cache")
        .upsert({ key: CACHE_KEY, payload: desk as unknown as Json, fetched_at: fetchedAt });
      if (error) console.error("[macro] desk cache write failed", error);
      return { desk, updatedAt: fetchedAt };
    } catch (error) {
      console.error("[macro] bot desk fetch failed", error);
      if (cached)
        return { desk: cached.payload as unknown as BotDesk, updatedAt: cached.fetched_at };
      return null;
    }
  },
);
