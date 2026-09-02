/**
 * Typed data layer for the Macro & Crypto feed.
 *
 * Everything below is realistic placeholder content. The shapes are the
 * contract an automated bot (or a database table) can fill later — keep the
 * types stable and swap the constant arrays for a fetch.
 */

export type MacroCategory = "Macro" | "Fundamentals" | "Crypto" | "Central Banks";

export const MACRO_CATEGORIES: MacroCategory[] = [
  "Macro",
  "Fundamentals",
  "Crypto",
  "Central Banks",
];

export type MacroUpdate = {
  id: string;
  category: MacroCategory;
  /** ISO-8601 UTC timestamp. */
  publishedAt: string;
  headline: string;
  summary: string;
  instruments: string[];
};

export type CalendarEvent = {
  id: string;
  /** HH:MM in UTC. */
  time: string;
  country: string;
  event: string;
  /** 1 = low, 2 = medium, 3 = high. */
  impact: 1 | 2 | 3;
};

export type CryptoMover = {
  symbol: string;
  name: string;
  price: string;
  changePct: number;
};

export const MACRO_UPDATES: MacroUpdate[] = [
  {
    id: "u-1",
    category: "Central Banks",
    publishedAt: "2026-09-02T06:40:00Z",
    headline: "Fed minutes point to a slower easing path into Q4",
    summary:
      "Officials flagged sticky services inflation as the main obstacle to a second cut this year. Rate futures now price roughly one cut by December, down from two a fortnight ago. Dollar strength is the immediate read-across.",
    instruments: ["DXY", "XAU/USD", "EUR/USD"],
  },
  {
    id: "u-2",
    category: "Macro",
    publishedAt: "2026-09-02T05:15:00Z",
    headline: "Gold holds the 4,590 shelf as real yields stall",
    summary:
      "Spot gold consolidated in a tight 18-dollar range overnight while 10-year real yields flatlined. Physical demand out of Asia stayed firm. A close above 4,612 opens the prior swing high.",
    instruments: ["XAU/USD", "XAG/USD"],
  },
  {
    id: "u-3",
    category: "Crypto",
    publishedAt: "2026-09-02T04:05:00Z",
    headline: "Bitcoin reclaims 94K on spot ETF inflows",
    summary:
      "Net creations across US spot ETFs turned positive for a fourth session. Perp funding stayed neutral, suggesting the move is spot-led rather than leverage-driven. 96.4K is the next liquidity pocket.",
    instruments: ["BTC/USD", "ETH/USD"],
  },
  {
    id: "u-4",
    category: "Fundamentals",
    publishedAt: "2026-09-01T21:30:00Z",
    headline: "Euro-area PMIs soften, services carry the composite",
    summary:
      "Manufacturing slipped further below 50 while services held expansionary. The composite still points to low-single-digit annualised growth. EUR crosses stayed heavy against the dollar.",
    instruments: ["EUR/USD", "EUR/JPY"],
  },
  {
    id: "u-5",
    category: "Crypto",
    publishedAt: "2026-09-01T18:10:00Z",
    headline: "Ether staking queue clears, unlocks weigh modestly",
    summary:
      "The validator exit queue normalised after last week's backlog. Exchange balances ticked up slightly but remain near multi-year lows. Range trade persists between 3,050 and 3,340.",
    instruments: ["ETH/USD", "BTC/USD"],
  },
  {
    id: "u-6",
    category: "Macro",
    publishedAt: "2026-09-01T13:00:00Z",
    headline: "US 30 stalls at record as breadth narrows",
    summary:
      "Index-level strength masked a narrowing advance-decline line, with defensives leading. Momentum traders should treat the current push as extended until breadth confirms.",
    instruments: ["US30", "NAS100"],
  },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "c-1", time: "08:30", country: "EUR", event: "ECB Lane speech", impact: 2 },
  { id: "c-2", time: "12:30", country: "USD", event: "ADP Employment Change", impact: 2 },
  { id: "c-3", time: "14:00", country: "USD", event: "ISM Services PMI", impact: 3 },
  { id: "c-4", time: "14:30", country: "USD", event: "Crude Oil Inventories", impact: 1 },
  { id: "c-5", time: "18:00", country: "USD", event: "FOMC Member Remarks", impact: 2 },
  { id: "c-6", time: "23:50", country: "JPY", event: "BoJ Summary of Opinions", impact: 2 },
];

export const CRYPTO_MOVERS: CryptoMover[] = [
  { symbol: "BTC", name: "Bitcoin", price: "94,240", changePct: 1.86 },
  { symbol: "ETH", name: "Ethereum", price: "3,182", changePct: 0.94 },
  { symbol: "SOL", name: "Solana", price: "214.60", changePct: -1.12 },
  { symbol: "XRP", name: "XRP", price: "2.41", changePct: 2.35 },
  { symbol: "BNB", name: "BNB", price: "681.20", changePct: -0.41 },
];

/** Human-friendly relative timestamp, stable between server and client. */
export function formatUpdateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toUTCString().slice(5, 22)} UTC`;
}
