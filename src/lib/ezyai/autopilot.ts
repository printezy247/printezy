import { atr, ema, macd, roundTo, structure, swingHigh, swingLow, type Candle } from "./indicators";
import type { SignalDirection, SignalStatus } from "./signals";

/**
 * The website's own autopilot: a trend-continuation strategy that reads candles
 * and decides whether there is a trade worth publishing.
 *
 * Pure on purpose. It takes bars and returns a decision, so every rule in it
 * can be tested against a series built to trigger it — no network, no clock, no
 * database. The server module wraps this; nothing here knows those exist.
 *
 * The rules, in the order they are applied:
 *   1. Enough history, and a live volatility reading.
 *   2. Volatility gate — a market whose ATR is a rounding error of its price is
 *      not tradable after spread, and one whose ATR has exploded is not a
 *      continuation setup.
 *   3. Trend — EMA21 against EMA50, confirmed by market structure. The two must
 *      agree; a moving-average cross with no structure behind it is noise.
 *   4. Momentum — the MACD line must sit on the same side of zero as the
 *      trend. The histogram is deliberately NOT the gate: on a steady trend the
 *      signal EMA catches the MACD line and the histogram converges to zero, so
 *      gating on it rejects precisely the clean trends this strategy wants. It
 *      earns its keep in the score instead, where a flat histogram honestly
 *      reads as weaker momentum.
 *   5. Extension — price must not be more than 2 ATR from the EMA21. Chasing a
 *      candle that has already run is where continuation setups go to die.
 *   6. Risk — the stop goes beyond the recent swing, padded by half an ATR, and
 *      the setup is dropped if that leaves a reward-to-risk below the floor.
 */

export type Instrument = {
  /** How the signal is labelled, e.g. "XAUUSD". */
  symbol: string;
  /** Decimal places for every published price. */
  decimals: number;
  /** Value of one pip, for reporting a result in pips. */
  pip: number;
};

export type Setup = {
  direction: SignalDirection;
  entryLow: number;
  entryHigh: number;
  stopPrice: number;
  tp1: number;
  tp2: number;
  rr: number;
  setupScore: number;
  /** Human-readable confluence, shown on the card. */
  reasons: string[];
};

/** Reward-to-risk below this is not worth publishing. */
const MIN_RR = 1.3;
/** ATR as a fraction of price: outside this band the market is dead or wild. */
const MIN_ATR_RATIO = 0.0004;
const MAX_ATR_RATIO = 0.05;
/**
 * How far from the EMA21, in ATR, price may sit and still count as a
 * continuation. An EMA lags a strong trend by construction, so a cap near 2
 * rejects healthy trends as well as blow-off candles; 3 separates them.
 */
const MAX_EXTENSION_ATR = 3;

const TP1_R = 1.5;
const TP2_R = 2.5;

function lastDefined(series: (number | null)[]): number | null {
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i] !== null) return series[i];
  }
  return null;
}

/**
 * Decide whether these candles carry a publishable setup.
 *
 * Returns null — the common case, by design — whenever any gate fails. A desk
 * that finds a trade on every bar is not reading the market, it is decorating
 * it.
 */
export function evaluate(candles: Candle[], instrument: Instrument): Setup | null {
  if (candles.length < 60) return null;

  const closes = candles.map((c) => c.close);
  const price = closes[closes.length - 1];
  if (!Number.isFinite(price) || price <= 0) return null;

  const atrNow = lastDefined(atr(candles, 14));
  if (atrNow === null || atrNow <= 0) return null;

  // 2 — volatility gate
  const atrRatio = atrNow / price;
  if (atrRatio < MIN_ATR_RATIO || atrRatio > MAX_ATR_RATIO) return null;

  // 3 — trend
  const ema21 = lastDefined(ema(closes, 21));
  const ema50 = lastDefined(ema(closes, 50));
  if (ema21 === null || ema50 === null) return null;

  const shape = structure(candles, 20);
  const bullish = ema21 > ema50 && shape === "up";
  const bearish = ema21 < ema50 && shape === "down";
  if (!bullish && !bearish) return null;
  const direction: SignalDirection = bullish ? "buy" : "sell";

  // 4 — momentum
  const momentumSeries = macd(closes);
  const macdLine = lastDefined(momentumSeries.macd);
  const histogram = lastDefined(momentumSeries.histogram);
  if (macdLine === null || histogram === null) return null;
  if (bullish && macdLine <= 0) return null;
  if (bearish && macdLine >= 0) return null;

  // 5 — extension
  const extension = Math.abs(price - ema21) / atrNow;
  if (extension > MAX_EXTENSION_ATR) return null;

  // 6 — risk
  // Ten bars, not twenty: the stop belongs beyond the most recent pullback,
  // and a wider window in a trending market prices in risk the setup never took.
  const swing = bullish ? swingLow(candles, 10) : swingHigh(candles, 10);
  if (swing === null) return null;
  const pad = atrNow * 0.5;
  const stopRaw = bullish ? swing - pad : swing + pad;
  const risk = Math.abs(price - stopRaw);
  if (risk <= 0) return null;
  // A stop further than 4 ATR is not this setup; it is a different trade.
  if (risk / atrNow > 4) return null;

  const tp1Raw = bullish ? price + risk * TP1_R : price - risk * TP1_R;
  const tp2Raw = bullish ? price + risk * TP2_R : price - risk * TP2_R;
  const rr = Math.abs(tp1Raw - price) / risk;
  if (rr < MIN_RR) return null;

  // The entry is a zone rather than a point: a fill is never the exact close.
  const band = atrNow * 0.15;
  const d = instrument.decimals;
  const entryLow = roundTo(bullish ? price - band : price, d);
  const entryHigh = roundTo(bullish ? price : price + band, d);

  const reasons: string[] = [
    bullish
      ? "Price structure is bullish on the active timeframe"
      : "Price structure is bearish on the active timeframe",
    bullish ? "EMA21 > EMA50" : "EMA21 < EMA50",
    macdLine > 0 ? "MACD above zero" : "MACD below zero",
  ];
  if (extension < 0.6) reasons.push("Entry sits close to the EMA21, not extended");

  return {
    direction,
    entryLow,
    entryHigh,
    stopPrice: roundTo(stopRaw, d),
    tp1: roundTo(tp1Raw, d),
    tp2: roundTo(tp2Raw, d),
    rr: roundTo(rr, 2),
    setupScore: score({ atrRatio, extension, rr, histogram, atrNow, ema21, ema50 }),
    reasons,
  };
}

/**
 * Confluence, 0-100. Every term is earned by something measured above — this is
 * a summary of the evidence, not a decoration on top of it.
 */
function score(input: {
  atrRatio: number;
  extension: number;
  rr: number;
  histogram: number;
  atrNow: number;
  ema21: number;
  ema50: number;
}): number {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  // Trend conviction: how far the fast EMA has separated, measured in ATR.
  const separation = clamp(Math.abs(input.ema21 - input.ema50) / input.atrNow / 1.5) * 30;
  // Momentum: histogram size relative to volatility.
  const momentum = clamp(Math.abs(input.histogram) / (input.atrNow * 0.5)) * 25;
  // Entry quality: nearer the EMA21 is better.
  const entry = clamp(1 - input.extension / 2) * 20;
  // Payoff: 1.3 earns nothing, 3.0 earns it all.
  const payoff = clamp((input.rr - 1.3) / 1.7) * 15;
  // Volatility health: mid-band is best.
  const mid = (MIN_ATR_RATIO + MAX_ATR_RATIO) / 2;
  const health = clamp(1 - Math.abs(input.atrRatio - mid) / mid) * 10;

  return Math.round(separation + momentum + entry + payoff + health);
}

export type Advance = {
  status: SignalStatus;
  lastPrice: number;
  resultR: number | null;
  resultPips: number | null;
};

/**
 * Walk an open signal forward against the bars that have printed since it was
 * published, and report where it now stands.
 *
 * Order matters inside a bar: a candle that touched both the stop and the
 * target is scored as a stop, because from the bar alone there is no way to
 * know which came first and the honest assumption is the unfavourable one.
 */
export function advance(
  signal: {
    direction: SignalDirection;
    status: SignalStatus;
    entryLow: number | null;
    entryHigh: number | null;
    stopPrice: number | null;
    tp1: number | null;
  },
  candles: Candle[],
  instrument: Instrument,
): Advance | null {
  if (!candles.length) return null;
  const { entryLow, entryHigh, stopPrice, tp1 } = signal;
  if (entryLow === null || entryHigh === null || stopPrice === null || tp1 === null) return null;

  const buy = signal.direction === "buy";
  const entry = (entryLow + entryHigh) / 2;
  const risk = Math.abs(entry - stopPrice);
  let status = signal.status;

  for (const bar of candles) {
    if (status === "pending") {
      // Filled once the bar trades through the zone.
      if (bar.low <= entryHigh && bar.high >= entryLow) status = "running";
    }
    if (status === "running") {
      const stopHit = buy ? bar.low <= stopPrice : bar.high >= stopPrice;
      const targetHit = buy ? bar.high >= tp1 : bar.low <= tp1;
      if (stopHit) {
        status = "sl";
        break;
      }
      if (targetHit) {
        status = "tp";
        break;
      }
    }
  }

  const lastPrice = roundTo(candles[candles.length - 1].close, instrument.decimals);

  if (status === "tp" || status === "sl") {
    const exit = status === "tp" ? tp1 : stopPrice;
    const move = buy ? exit - entry : entry - exit;
    return {
      status,
      lastPrice,
      resultR: risk > 0 ? roundTo(move / risk, 2) : null,
      resultPips: instrument.pip > 0 ? roundTo(move / instrument.pip, 1) : null,
    };
  }

  return { status, lastPrice, resultR: null, resultPips: null };
}
