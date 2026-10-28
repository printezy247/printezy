import { createServerFn } from "@tanstack/react-start";
import type { Json } from "@/integrations/supabase/types";
import { parseUsdFxQuotes, type FxQuotes } from "@/lib/locale-pricing";

const CACHE_KEY = "locale_usd_fx_quotes";
const MAX_CACHE_AGE_MS = 48 * 60 * 60 * 1000;

export type LocaleFxRates = { date: string; quotes: FxQuotes } | null;

/** Daily reference conversion rates, not prices charged at checkout. */
export const getLocaleFxRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<LocaleFxRates> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let cached: LocaleFxRates = null;
    let fetchedAt: string | null = null;

    try {
      const { data } = await supabaseAdmin
        .from("macro_calendar_cache")
        .select("payload, fetched_at")
        .eq("key", CACHE_KEY)
        .maybeSingle();
      const parsed = parseUsdFxQuotes((data?.payload as { rates?: unknown } | null)?.rates);
      if (parsed && data?.fetched_at) {
        cached = parsed;
        fetchedAt = data.fetched_at;
        if (Date.now() - new Date(fetchedAt).getTime() < MAX_CACHE_AGE_MS) return cached;
      }
    } catch (error) {
      console.error("[fx] cache read failed", error);
    }

    try {
      const response = await fetch(
        "https://api.frankfurter.dev/v2/rates?base=USD&quotes=MYR,INR,SAR",
        { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) },
      );
      if (!response.ok) throw new Error(`Frankfurter responded ${response.status}`);
      const providerPayload: unknown = await response.json();
      const parsed = parseUsdFxQuotes(providerPayload);
      if (!parsed) throw new Error("Frankfurter returned incomplete or invalid USD quotes");
      await supabaseAdmin.from("macro_calendar_cache").upsert({
        key: CACHE_KEY,
        payload: { rates: providerPayload as Json },
        fetched_at: new Date().toISOString(),
      });
      return parsed;
    } catch (error) {
      console.error("[fx] daily reference-rate refresh failed", error);
      return cached;
    }
  },
);
