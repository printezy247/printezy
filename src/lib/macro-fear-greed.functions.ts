import { createServerFn } from "@tanstack/react-start";
import type { Json } from "@/integrations/supabase/types";
import type { FearGreed } from "@/lib/macro-desk";

const CACHE_KEY = "crypto_fear_greed";
const FRESH_MS = 5 * 60 * 1000;
const SEED: FearGreed = { value: 54, label: "Neutral", source: "alternative.me" };

type CachedPayload = { value?: number; label?: string; source?: string };
type CacheClient = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];

function parseCachedValue(payload: unknown): FearGreed | null {
  const value = payload as CachedPayload | null;
  if (!value || typeof value.value !== "number" || !Number.isFinite(value.value)) return null;
  return {
    value: Math.max(0, Math.min(100, value.value)),
    label: typeof value.label === "string" ? value.label : SEED.label,
    source: "alternative.me",
  };
}

/** Serve a five-minute cached value; a failed upstream read uses the last good value. */
export const getCryptoFearGreed = createServerFn({ method: "GET" }).handler(
  async (): Promise<FearGreed> => {
    let cache: CacheClient | undefined;
    let previous: FearGreed | null = null;
    let cachedAt: string | undefined;

    try {
      const client = await import("@/integrations/supabase/client.server");
      cache = client.supabaseAdmin;
      const { data } = await cache
        .from("macro_calendar_cache")
        .select("payload, fetched_at")
        .eq("key", CACHE_KEY)
        .maybeSingle();
      previous = parseCachedValue(data?.payload);
      cachedAt = data?.fetched_at;
      if (previous && cachedAt && Date.now() - new Date(cachedAt).getTime() < FRESH_MS) {
        return previous;
      }
    } catch (error) {
      // A database outage should not prevent a keyless public API read.
      console.error("[macro] Fear & Greed cache read failed", error);
    }

    try {
      const response = await fetch("https://api.alternative.me/fng/?limit=1", {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Alternative.me responded ${response.status}`);
      const body = (await response.json()) as {
        data?: { value?: string; value_classification?: string }[];
      };
      const row = body.data?.[0];
      const value = Number(row?.value);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error("Alternative.me returned an invalid Fear & Greed value");
      }
      const result: FearGreed = {
        value,
        label: row?.value_classification || SEED.label,
        source: "alternative.me",
      };
      if (cache) {
        const { error } = await cache.from("macro_calendar_cache").upsert({
          key: CACHE_KEY,
          payload: result as unknown as Json,
          fetched_at: new Date().toISOString(),
        });
        if (error) console.error("[macro] Fear & Greed cache write failed", error);
      }
      return result;
    } catch (error) {
      console.error("[macro] Fear & Greed fetch failed", error);
      return previous ?? SEED;
    }
  },
);
