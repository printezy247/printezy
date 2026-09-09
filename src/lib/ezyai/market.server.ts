import type { Candle } from "./indicators";
import type { Instrument } from "./autopilot";

/**
 * Candle feeds for the website's own autopilot.
 *
 * Yahoo, for everything including crypto. Public and keyless, which matters —
 * a feed that needs a secret is a feed that silently stops working when the
 * secret expires, and that is the failure this whole board was stuck behind.
 *
 * Binance was the original crypto source, matching what the Telegram desk
 * reads. It is gone because it does not work from here: the first production
 * run scanned all six Yahoo instruments and returned "only 0 bars" for both
 * Binance ones, which is what a datacenter-IP block looks like. Yahoo quotes
 * BTC-USD and ETH-USD perfectly well, and a working feed beats a matching one.
 *
 * Every fetch is bounded and every failure is contained: a provider that is
 * down costs its own instrument and nothing else.
 */

export type Feed = "yahoo";

export type WatchedInstrument = Instrument & {
  feed: Feed;
  /** The provider's own ticker, which is rarely the display symbol. */
  feedSymbol: string;
};

/**
 * The watchlist. Kept deliberately short: every instrument is a network call on
 * every run, and a board with forty half-considered markets is worth less than
 * one with eight the desk actually watches.
 */
export const WATCHLIST: WatchedInstrument[] = [
  { symbol: "XAUUSD", feed: "yahoo", feedSymbol: "GC=F", decimals: 2, pip: 0.1 },
  { symbol: "XAGUSD", feed: "yahoo", feedSymbol: "SI=F", decimals: 3, pip: 0.01 },
  {
    symbol: "EURUSD",
    feed: "yahoo",
    feedSymbol: "EURUSD=X",
    decimals: 5,
    pip: 0.0001,
  },
  {
    symbol: "GBPUSD",
    feed: "yahoo",
    feedSymbol: "GBPUSD=X",
    decimals: 5,
    pip: 0.0001,
  },
  {
    symbol: "USDJPY",
    feed: "yahoo",
    feedSymbol: "USDJPY=X",
    decimals: 3,
    pip: 0.01,
  },
  { symbol: "WTIUSD", feed: "yahoo", feedSymbol: "CL=F", decimals: 2, pip: 0.01 },
  { symbol: "BTCUSD", feed: "yahoo", feedSymbol: "BTC-USD", decimals: 2, pip: 1 },
  { symbol: "ETHUSD", feed: "yahoo", feedSymbol: "ETH-USD", decimals: 2, pip: 0.1 },
];

/**
 * Short on purpose: a page load waits on this, so a provider having a slow
 * minute must cost a second or two, not the reader's patience. A missed bar is
 * recoverable; a board that takes half a minute to appear is not.
 */
const TIMEOUT_MS = 5000;

async function getJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        // Yahoo answers 4xx to a request with no user agent.
        "user-agent": "Mozilla/5.0 (compatible; EzyMapALGO/1.0; +https://printezy.money)",
        accept: "application/json",
      },
    });
    if (!response.ok) {
      console.error(`[autopilot] ${url} -> ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`[autopilot] ${url} failed`, error);
    return null;
  }
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Yahoo's chart endpoint, which returns parallel arrays rather than records. */
async function yahooCandles(feedSymbol: string, interval: string, bars: number): Promise<Candle[]> {
  // Yahoo caps how far back each interval reaches; asking for more than the
  // cap returns an error rather than a truncated series.
  const range = interval === "1d" ? "1y" : interval === "5m" ? "5d" : "5d";
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(feedSymbol)}` +
    `?interval=${interval}&range=${range}`;
  const body = (await getJson(url)) as {
    chart?: {
      result?: {
        timestamp?: number[];
        indicators?: {
          quote?: {
            open?: (number | null)[];
            high?: (number | null)[];
            low?: (number | null)[];
            close?: (number | null)[];
          }[];
        };
      }[];
    };
  } | null;

  const result = body?.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const times = result?.timestamp;
  if (!result || !quote || !times) return [];

  const candles: Candle[] = [];
  for (let i = 0; i < times.length; i += 1) {
    // Yahoo pads its arrays with nulls for bars it has no data for; those are
    // holes in the series, not zeroes, so they are dropped rather than filled.
    const open = finite(quote.open?.[i]);
    const high = finite(quote.high?.[i]);
    const low = finite(quote.low?.[i]);
    const close = finite(quote.close?.[i]);
    if (open === null || high === null || low === null || close === null) continue;
    candles.push({ time: times[i] * 1000, open, high, low, close });
  }
  return candles.slice(-bars);
}

/** Bars for one instrument, newest last. Empty when the feed is unavailable. */
export async function loadCandles(
  instrument: WatchedInstrument,
  interval: string,
  bars = 200,
): Promise<Candle[]> {
  const candles = await yahooCandles(instrument.feedSymbol, interval, bars);

  // The final bar on both feeds is the one still forming. Publishing levels off
  // a half-built candle means the levels move under the reader, so it goes.
  return candles.slice(0, -1);
}
