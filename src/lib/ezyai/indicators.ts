/**
 * The indicator maths behind the website's own autopilot.
 *
 * Deliberately dependency-free and pure: every function here takes numbers and
 * returns numbers, so the strategy that sits on top can be checked against
 * hand-computed values rather than trusted. Nothing in this file touches the
 * network, the clock or the database.
 */

export type Candle = {
  /** Epoch milliseconds of the bar's open. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/**
 * Exponential moving average, seeded with a simple average of the first
 * `period` values — the conventional seeding, and the one that makes the series
 * comparable with what a charting platform draws.
 *
 * Returns one value per input, with `null` until enough bars exist.
 */
export function ema(values: number[], period: number): (number | null)[] {
  if (period <= 0) throw new Error("ema: period must be positive");
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;

  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i += 1) seed += values[i];
  let previous = seed / period;
  out[period - 1] = previous;

  for (let i = period; i < values.length; i += 1) {
    previous = values[i] * k + previous * (1 - k);
    out[i] = previous;
  }
  return out;
}

export type Macd = {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
};

/**
 * MACD(12, 26, 9). The signal line is an EMA of the MACD line, which only
 * exists once the slow EMA does — so the compacting step below keeps the
 * signal aligned to the original index rather than to the shortened series.
 */
export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9): Macd {
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);

  const line: (number | null)[] = values.map((_, i) => {
    const f = fastEma[i];
    const s = slowEma[i];
    return f === null || s === null ? null : f - s;
  });

  const firstDefined = line.findIndex((v) => v !== null);
  const signal: (number | null)[] = new Array(values.length).fill(null);
  if (firstDefined !== -1) {
    const dense = line.slice(firstDefined) as number[];
    const denseSignal = ema(dense, signalPeriod);
    for (let i = 0; i < denseSignal.length; i += 1) signal[firstDefined + i] = denseSignal[i];
  }

  const histogram: (number | null)[] = values.map((_, i) => {
    const m = line[i];
    const s = signal[i];
    return m === null || s === null ? null : m - s;
  });

  return { macd: line, signal, histogram };
}

/**
 * Average true range, Wilder-smoothed. True range accounts for gaps, which is
 * why it is the high-low span only for the first bar.
 */
export function atr(candles: Candle[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period + 1) return out;

  const trueRanges: number[] = [];
  for (let i = 0; i < candles.length; i += 1) {
    const c = candles[i];
    if (i === 0) {
      trueRanges.push(c.high - c.low);
      continue;
    }
    const previousClose = candles[i - 1].close;
    trueRanges.push(
      Math.max(c.high - c.low, Math.abs(c.high - previousClose), Math.abs(c.low - previousClose)),
    );
  }

  let sum = 0;
  for (let i = 1; i <= period; i += 1) sum += trueRanges[i];
  let previous = sum / period;
  out[period] = previous;

  for (let i = period + 1; i < candles.length; i += 1) {
    previous = (previous * (period - 1) + trueRanges[i]) / period;
    out[i] = previous;
  }
  return out;
}

/** The lowest low over the last `lookback` closed bars. */
export function swingLow(candles: Candle[], lookback = 20): number | null {
  const window = candles.slice(-lookback);
  if (!window.length) return null;
  return window.reduce((low, c) => Math.min(low, c.low), Infinity);
}

/** The highest high over the last `lookback` closed bars. */
export function swingHigh(candles: Candle[], lookback = 20): number | null {
  const window = candles.slice(-lookback);
  if (!window.length) return null;
  return window.reduce((high, c) => Math.max(high, c.high), -Infinity);
}

/**
 * Whether the recent series is making higher highs and higher lows, or the
 * reverse. Compares the two halves of the window rather than adjacent bars, so
 * a single spike does not flip the reading.
 */
export function structure(candles: Candle[], lookback = 20): "up" | "down" | "flat" {
  if (candles.length < lookback) return "flat";
  const window = candles.slice(-lookback);
  const half = Math.floor(window.length / 2);
  const older = window.slice(0, half);
  const newer = window.slice(half);

  const olderHigh = Math.max(...older.map((c) => c.high));
  const newerHigh = Math.max(...newer.map((c) => c.high));
  const olderLow = Math.min(...older.map((c) => c.low));
  const newerLow = Math.min(...newer.map((c) => c.low));

  if (newerHigh > olderHigh && newerLow > olderLow) return "up";
  if (newerHigh < olderHigh && newerLow < olderLow) return "down";
  return "flat";
}

/** Round to the instrument's tick size without floating-point crumbs. */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
