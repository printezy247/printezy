import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Live quotes for the header ticker.
 *
 * The ticker used to be fifteen hardcoded strings — a row of prices that had
 * not moved since the day they were typed, presented as a market feed. This
 * replaces them with real quotes from the same Yahoo endpoint the autopilot
 * reads, which is already proven to work from this worker.
 *
 * Two rules follow from where it sits. It is on every page, so it is cached
 * hard and never fetched twice inside the TTL. And it never invents a number:
 * a quote that cannot be fetched is omitted, and a ticker with nothing real to
 * show renders as nothing rather than as fiction.
 */

const CACHE_KEY = "header-ticker-v1";
const TTL_MS = 60 * 1000;
const TIMEOUT_MS = 4000;

type Tracked = { symbol: string; feedSymbol: string; decimals: number };

/** Display symbol → Yahoo ticker. */
const TRACKED: Tracked[] = [
  { symbol: "XAU/USD", feedSymbol: "GC=F", decimals: 2 },
  { symbol: "XAG/USD", feedSymbol: "SI=F", decimals: 3 },
  { symbol: "EUR/USD", feedSymbol: "EURUSD=X", decimals: 4 },
  { symbol: "GBP/USD", feedSymbol: "GBPUSD=X", decimals: 4 },
  { symbol: "USD/JPY", feedSymbol: "USDJPY=X", decimals: 2 },
  { symbol: "AUD/USD", feedSymbol: "AUDUSD=X", decimals: 4 },
  { symbol: "USD/CAD", feedSymbol: "USDCAD=X", decimals: 4 },
  { symbol: "BTC/USD", feedSymbol: "BTC-USD", decimals: 0 },
  { symbol: "ETH/USD", feedSymbol: "ETH-USD", decimals: 2 },
  { symbol: "SOL/USD", feedSymbol: "SOL-USD", decimals: 2 },
  { symbol: "US30", feedSymbol: "^DJI", decimals: 0 },
  { symbol: "US500", feedSymbol: "^GSPC", decimals: 2 },
  { symbol: "NAS100", feedSymbol: "^NDX", decimals: 0 },
  { symbol: "USOIL", feedSymbol: "CL=F", decimals: 2 },
  { symbol: "UKOIL", feedSymbol: "BZ=F", decimals: 2 },
];

export type Quote = {
  symbol: string;
  /** Already formatted for display, so the client never re-rounds it. */
  price: string;
  change: string;
  up: boolean;
};

export type TickerPayload = {
  quotes: Quote[];
  /** When these quotes were actually fetched. Null when there are none. */
  asOf: string | null;
};

const EMPTY: TickerPayload = { quotes: [], asOf: null };

function format(value: number, decimals: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * One quote. The chart endpoint's `meta` carries both the last price and the
 * previous close, which is everything a ticker needs in a single call.
 */
async function fetchQuote(tracked: Tracked): Promise<Quote | null> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(tracked.feedSymbol)}` +
    `?interval=1d&range=5d`;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; EzyMapALGO/1.0; +https://printezy.money)",
        accept: "application/json",
      },
    });
    if (!response.ok) return null;

    const body = (await response.json()) as {
      chart?: {
        result?: { meta?: { regularMarketPrice?: number; chartPreviousClose?: number } }[];
      };
    };
    const meta = body?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const previous = meta?.chartPreviousClose;
    if (typeof price !== "number" || !Number.isFinite(price)) return null;

    // Without a previous close there is no honest percentage to show, so the
    // quote goes out flat rather than with a number made up from one price.
    const hasPrevious = typeof previous === "number" && Number.isFinite(previous) && previous !== 0;
    const pct = hasPrevious ? ((price - previous) / previous) * 100 : 0;

    return {
      symbol: tracked.symbol,
      price: format(price, tracked.decimals),
      change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      up: pct >= 0,
    };
  } catch {
    return null;
  }
}

async function readCache(): Promise<{ payload: TickerPayload; fetchedAt: number } | null> {
  const { data, error } = await supabaseAdmin
    .from("market_quote_cache")
    .select("payload, fetched_at")
    .eq("key", CACHE_KEY)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as { payload: TickerPayload; fetched_at: string };
  return { payload: row.payload, fetchedAt: new Date(row.fetched_at).getTime() };
}

/**
 * The ticker's quotes, from cache when they are fresh enough.
 *
 * On a feed failure the last cached quotes are served rather than nothing:
 * they were real when they were fetched, and `asOf` says when that was. Only
 * an empty cache with a failing feed produces an empty ticker.
 */
export async function loadTicker(): Promise<TickerPayload> {
  let cached: Awaited<ReturnType<typeof readCache>> = null;
  try {
    cached = await readCache();
  } catch (error) {
    console.error("[ticker] cache read failed", error);
  }

  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.payload;

  const results = await Promise.all(TRACKED.map(fetchQuote));
  const quotes = results.filter((q): q is Quote => q !== null);

  // A feed having a bad minute must not blank the header.
  if (!quotes.length) return cached?.payload ?? EMPTY;

  const payload: TickerPayload = { quotes, asOf: new Date().toISOString() };
  try {
    await supabaseAdmin
      .from("market_quote_cache")
      .upsert({ key: CACHE_KEY, payload, fetched_at: new Date().toISOString() } as never);
  } catch (error) {
    console.error("[ticker] cache write failed", error);
  }
  return payload;
}
