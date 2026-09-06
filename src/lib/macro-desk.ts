/**
 * Typed data layer for the /macro "Macro & Crypto" desk.
 *
 * Live parts: the economic calendar (ForexFactory feed via
 * src/lib/macro-calendar.functions.ts) and the Crypto Fear & Greed index.
 *
 * NOTE: everything else is still seeded copy. The MacroTrader bot has no
 * public read API — webhook_server.py only exposes POST /webhook/stripe and
 * heatmap messages are built in-process and pushed straight to Telegram by
 * scheduler/tasks.py. Every seeded read goes through fetchMacroDesk(), a
 * single swappable client function. Wiring it to live data needs a new JSON
 * endpoint on the bot's Flask app (e.g. GET /api/heatmaps/<key>) plus a
 * subscription check — a bot-side task.
 */

/* ------------------------------------------------------------------ */
/* Pricing (mirrors the bot's config exactly)                          */
/* ------------------------------------------------------------------ */

export const MACRO_PRICES = {
  /** FREE_TIER_HEATMAP — the economic calendar is the only ungated card. */
  calendar: "FREE",
  /** The four premium heatmaps ship as one product. */
  heatmaps: "$19/mo",
  addon: "$9/mo",
  yieldOptimizer: "$12/mo",
} as const;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type MacroFilter =
  | "All"
  | "Calendar"
  | "Central Banks"
  | "Recession"
  | "Crypto"
  | "Sentiment";

export const MACRO_FILTERS: MacroFilter[] = [
  "All",
  "Calendar",
  "Central Banks",
  "Recession",
  "Crypto",
  "Sentiment",
];

export type Impact = "high" | "medium" | "low";

export type CalendarRow = {
  /** New York wall-clock "HH:MM" — converted to the visitor's timezone in the UI. */
  nyTime: string;
  currency: string;
  event: string;
  impact: Impact;
  forecast: string;
  previous: string;
};

export type Stance = "hawkish" | "neutral" | "dovish";

export type CentralBankRow = {
  bank: string;
  rate: string;
  stance: Stance;
  nextMeeting: string;
};

export type RecessionRow = {
  country: string;
  probability: number;
  driver: string;
};

export type TrendCard = {
  key: "fed-tone" | "news-sentiment";
  title: string;
  description: string;
  price: string;
  /** Catalog SKU (see src/lib/catalog.ts) for direct card checkout. */
  sku: string;
  /** 0-7 indices into the sparkline ramp. */
  trend: number[];
  readout: string;
};

export type CryptoAddon = {
  name: string;
  description: string;
  price: string;
  /** Catalog SKU (see src/lib/catalog.ts) for direct card checkout. */
  sku: string;
};

export type RateDecision = { bank: string; date: string };

export type FearGreed = {
  value: number;
  label: string;
  source: string;
};

export type MacroDesk = {
  centralBanks: CentralBankRow[];
  recession: RecessionRow[];
  trends: TrendCard[];
  cryptoAddons: CryptoAddon[];
  rateDecisions: RateDecision[];
  fearGreed: FearGreed;
};

/* ------------------------------------------------------------------ */
/* Seed content (the bot's actual copy)                                */
/* ------------------------------------------------------------------ */

const SEED: MacroDesk = {
  // Fallback only (shown with a "sample data" note when the bot bridge is
  // not configured). Values as published at each bank's mid-2026 decisions.
  centralBanks: [
    { bank: "Federal Reserve", rate: "3.50–3.75%", stance: "dovish", nextMeeting: "Sep 16" },
    { bank: "European Central Bank", rate: "2.25%", stance: "neutral", nextMeeting: "Sep 10" },
    { bank: "Bank of England", rate: "3.75%", stance: "dovish", nextMeeting: "Sep 17" },
    { bank: "Bank of Japan", rate: "1.00%", stance: "hawkish", nextMeeting: "Sep 18" },
    { bank: "Swiss National Bank", rate: "0.00%", stance: "neutral", nextMeeting: "Sep 24" },
  ],
  recession: [
    { country: "United States", probability: 35, driver: "10Y-2Y yield curve inverted" },
    { country: "Eurozone", probability: 42, driver: "Manufacturing PMI in contraction" },
    { country: "United Kingdom", probability: 28, driver: "Retail sales declining" },
    { country: "China", probability: 20, driver: "Property sector stress" },
    { country: "Japan", probability: 15, driver: "Stable industrial production" },
  ],
  trends: [
    {
      key: "fed-tone",
      title: "Fed Tone Tracker",
      description:
        "Speech-by-speech hawkish and dovish scoring taken from the Fed's own releases, tracked as a 7-day tone trend.",
      price: MACRO_PRICES.addon,
      sku: "macro_addon",
      trend: [3, 4, 4, 5, 6, 6, 7],
      readout: "7-day tone: drifting hawkish",
    },
    {
      key: "news-sentiment",
      title: "News Sentiment",
      description:
        "Aggregated macro and crypto headline sentiment, scored daily and tracked as a trend.",
      price: MACRO_PRICES.addon,
      sku: "macro_addon",
      trend: [5, 4, 4, 3, 4, 5, 4],
      readout: "7-day sentiment: neutral",
    },
  ],
  cryptoAddons: [
    {
      name: "Options Flow Analyzer",
      description: "Deribit BTC and ETH options positioning",
      price: MACRO_PRICES.addon,
      sku: "macro_addon",
    },
    {
      name: "Whale Wallet Alerts",
      description: "Watch up to 5 wallets; large ETH and BTC transfers flagged within 20 minutes",
      price: MACRO_PRICES.addon,
      sku: "macro_addon",
    },
    {
      name: "Gold Futures Roll Calendar",
      description: "Contract roll dates and expiry alerts",
      price: MACRO_PRICES.addon,
      sku: "macro_addon",
    },
    {
      name: "Yield Optimizer & Risk Scorer",
      description: "DeFi yields with risk scoring, TVL trend and an impermanent-loss calculator",
      price: MACRO_PRICES.yieldOptimizer,
      sku: "macro_yield_optimizer",
    },
  ],
  rateDecisions: [
    { bank: "European Central Bank", date: "Sep 10" },
    { bank: "Federal Reserve", date: "Sep 16" },
    { bank: "Bank of England", date: "Sep 17" },
    { bank: "Bank of Japan", date: "Sep 18" },
    { bank: "Swiss National Bank", date: "Sep 24" },
  ],
  fearGreed: { value: 54, label: "Neutral", source: "alternative.me" },
};

/** Single swappable read. Replace the body with a fetch once the bot exposes JSON. */
export async function fetchMacroDesk(): Promise<MacroDesk> {
  return SEED;
}

/** Live, keyless Crypto Fear & Greed read. Falls back to the seeded value. */
export async function fetchFearGreed(): Promise<FearGreed> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    if (!res.ok) throw new Error("bad status");
    const json = (await res.json()) as {
      data?: { value?: string; value_classification?: string }[];
    };
    const row = json.data?.[0];
    const value = Number(row?.value);
    if (!Number.isFinite(value)) throw new Error("bad payload");
    return {
      value,
      label: row?.value_classification ?? SEED.fearGreed.label,
      source: "alternative.me",
    };
  } catch {
    return SEED.fearGreed;
  }
}

/* ------------------------------------------------------------------ */
/* Monospace gauges (ports of the bot's gauge.py)                      */
/* ------------------------------------------------------------------ */

const SPARK_RAMP = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

/** Muted track colour — empty gauge characters never carry the data colour. */
export const GAUGE_TRACK = "#3a403c";

export type GaugeSegments = { before: string; marker: string; after: string };

/** 10-char dovish→hawkish track with a ● marker, as in gauge.py. */
export function sliderGauge(stance: Stance): GaugeSegments {
  const position = stance === "hawkish" ? 9 : stance === "neutral" ? 4 : 0;
  return {
    before: "░".repeat(position),
    marker: "●",
    after: "░".repeat(9 - position),
  };
}

/** 10-char filled bar for a 0-100 percentage. */
export function fillGauge(percent: number): GaugeSegments {
  const filled = Math.max(0, Math.min(10, Math.round(percent / 10)));
  return { before: "", marker: "█".repeat(filled), after: "░".repeat(10 - filled) };
}

export function sparkline(points: number[]): string {
  return points.map((p) => SPARK_RAMP[Math.max(0, Math.min(7, p))]).join("");
}

export const IMPACT_COLOR: Record<Impact, string> = {
  high: "#d9534f",
  medium: "#c9a13a",
  low: "#2fbf71",
};

export function stanceColor(stance: Stance): string {
  return stance === "hawkish" ? "#2fbf71" : stance === "neutral" ? "#c9a13a" : "#d9534f";
}

export function recessionColor(percent: number): string {
  return percent >= 50 ? "#d9534f" : percent >= 25 ? "#c9a13a" : "#2fbf71";
}
