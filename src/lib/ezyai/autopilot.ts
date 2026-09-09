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

/** ATR as a fraction of price: outside this band the market is dead or wild. */
const MIN_ATR_RATIO = 0.0004;
const MAX_ATR_RATIO = 0.05;

/**
 * The three ways the desk trades, mirroring the modes the Telegram bot runs.
 *
 * They are not the same strategy with a different label on it. A scalp lives
 * inside the noise, so it takes a tighter stop, a nearer target and a lower
 * reward-to-risk floor — demanding 1.5 R from a five-minute continuation just
 * means never taking one. A swing is the opposite: a wider stop it has to be
 * paid properly for, so the floor rises with it. Extension tolerance widens
 * with the timeframe too, because a daily EMA lags a daily trend by more than
 * a five-minute EMA lags a five-minute one.
 *
 * `minGapMs` is how often the profile is worth re-examining. Re-running a
 * daily-bar strategy every five minutes cannot find anything new; it just
 * spends a network call to reach the same answer.
 */
export type ProfileName = "scalping" | "intraday" | "swing";

export type StrategyProfile = {
  name: ProfileName;
  /** Shown on the card, and the interval requested from the feed. */
  timeframe: string;
  label: string;
  minRr: number;
  tp1R: number;
  tp2R: number;
  swingLookback: number;
  maxExtensionAtr: number;
  /** Widest stop the setup may carry, in ATR. */
  maxRiskAtr: number;
  minGapMs: number;
  minBars: number;
};

export const PROFILES: StrategyProfile[] = [
  {
    name: "scalping",
    timeframe: "5m",
    label: "Scalping · Normal risk · 5m",
    minRr: 1.1,
    tp1R: 1.2,
    tp2R: 2,
    swingLookback: 8,
    maxExtensionAtr: 2.5,
    maxRiskAtr: 3,
    minGapMs: 5 * 60 * 1000,
    minBars: 60,
  },
  {
    name: "intraday",
    timeframe: "15m",
    label: "Intraday · Normal risk · 15m",
    minRr: 1.3,
    tp1R: 1.5,
    tp2R: 2.5,
    swingLookback: 10,
    maxExtensionAtr: 3,
    maxRiskAtr: 4,
    minGapMs: 15 * 60 * 1000,
    minBars: 60,
  },
  {
    name: "swing",
    timeframe: "1d",
    label: "Swing · Normal risk · 1d",
    minRr: 1.5,
    tp1R: 2,
    tp2R: 3.5,
    swingLookback: 14,
    maxExtensionAtr: 3.5,
    maxRiskAtr: 5,
    minGapMs: 60 * 60 * 1000,
    minBars: 80,
  },
];

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
export function evaluate(
  candles: Candle[],
  instrument: Instrument,
  profile: StrategyProfile,
): Setup | null {
  if (candles.length < profile.minBars) return null;

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
  if (extension > profile.maxExtensionAtr) return null;

  // 6 — risk
  // Ten bars, not twenty: the stop belongs beyond the most recent pullback,
  // and a wider window in a trending market prices in risk the setup never took.
  const swing = bullish
    ? swingLow(candles, profile.swingLookback)
    : swingHigh(candles, profile.swingLookback);
  if (swing === null) return null;
  const pad = atrNow * 0.5;
  const stopRaw = bullish ? swing - pad : swing + pad;
  const risk = Math.abs(price - stopRaw);
  if (risk <= 0) return null;
  // A stop wider than the profile allows is not this setup; it is a different
  // trade wearing its name.
  if (risk / atrNow > profile.maxRiskAtr) return null;

  const tp1Raw = bullish ? price + risk * profile.tp1R : price - risk * profile.tp1R;
  const tp2Raw = bullish ? price + risk * profile.tp2R : price - risk * profile.tp2R;
  const rr = Math.abs(tp1Raw - price) / risk;
  if (rr < profile.minRr) return null;

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
    setupScore: score({ atrRatio, extension, rr, histogram, atrNow, ema21, ema50, profile }),
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
  profile: StrategyProfile;
}): number {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  // Trend conviction: how far the fast EMA has separated, measured in ATR.
  const separation = clamp(Math.abs(input.ema21 - input.ema50) / input.atrNow / 1.5) * 30;
  // Momentum: histogram size relative to volatility.
  const momentum = clamp(Math.abs(input.histogram) / (input.atrNow * 0.5)) * 25;
  // Entry quality: nearer the EMA21 is better.
  const entry = clamp(1 - input.extension / input.profile.maxExtensionAtr) * 20;
  // Payoff, measured against this profile's own floor: the minimum earns
  // nothing, and 1.7 R above it earns the lot.
  const payoff = clamp((input.rr - input.profile.minRr) / 1.7) * 15;
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
