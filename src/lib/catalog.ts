// Client-safe product catalogue.
// Prices mirror config/packages.json in the EzyMap bot repo (USD).

export type CatalogGroup = "package" | "tradingview" | "mt5" | "macro";

export type CatalogItem = {
  sku: string;
  group: CatalogGroup;
  name: string;
  description: string;
  /** Price in cents, charged as a one-time payment for the stated term. */
  amountCents: number;
  /** Term shown next to the price, e.g. "1 Month" or "One-time". */
  term: string;
  bullets: string[];
  badge?: string;
};

export const CATALOG: CatalogItem[] = [
  /* ---------------------------- Signal packages --------------------------- */
  {
    sku: "signal_beginner",
    group: "package",
    name: "Beginner Package",
    description: "Foundations, ebooks and the EzyMap Lite TradingView indicator.",
    amountCents: 2900,
    term: "One-time",
    bullets: [
      "eBook: Technical Analysis & Mapping Like A Pro",
      "EzyMap Lite indicator (TradingView)",
      "Free public channel access",
    ],
  },
  {
    sku: "signal_pro",
    group: "package",
    name: "Pro Package",
    description: "EzyScalper M1 & M5 private signal channel plus the MT5 strength meter.",
    amountCents: 4900,
    term: "One-time",
    bullets: [
      "EzyScalper — M1 & M5 private signals",
      "MT5 Currency Strength Meter",
      "Everything in Beginner",
    ],
  },
  {
    sku: "signal_premium",
    group: "package",
    name: "Premium Package",
    description: "EzyMap Pro indicator, Auto TPSL, MTF Bias and the intraday signal channel.",
    amountCents: 9900,
    term: "One-time",
    bullets: [
      "EzyMap Pro indicator (TradingView) — M1–H4 signals",
      "MT5 Auto TPSL & MTF Bias",
      "EzyIntraday — M15 & M30 private signals",
      "Everything in Pro",
    ],
    badge: "Most popular",
  },
  {
    sku: "signal_elite",
    group: "package",
    name: "Elite Package",
    description: "The full MT5 indicator set, swing signals and 1-on-1 support.",
    amountCents: 29900,
    term: "One-time",
    bullets: [
      "Full MT5 indicator set incl. Drawdown Guardian & Bulk Close",
      "EzySwing — H1 & H4 private signals",
      "Ezy Elite Circle — 1-on-1 support",
      "Everything in Premium",
    ],
  },

  /* --------------------------- TradingView tools -------------------------- */
  {
    sku: "tv_lite",
    group: "tradingview",
    name: "TradingView — EzyMap Lite",
    description: "Entry-level mapping overlay for TradingView charts.",
    amountCents: 4900,
    term: "One-time",
    bullets: ["Auto support & resistance mapping", "Buy/sell bias arrows", "Lifetime updates"],
  },
  {
    sku: "tv_pro",
    group: "tradingview",
    name: "TradingView — EzyMap Pro",
    description: "The full M1–H4 signal engine used in the Premium package.",
    amountCents: 24900,
    term: "One-time",
    bullets: ["M1–H4 entry, SL and TP signals", "Multi-timeframe confluence filter", "Lifetime updates"],
    badge: "Most complete",
  },

  /* ------------------------------- MT5 tools ------------------------------ */
  {
    sku: "mt5_bundle_1m",
    group: "mt5",
    name: "MT5 Indicator Bundle — 1 Month",
    description: "Every MT5 tool in one licence (worth $999).",
    amountCents: 9900,
    term: "1 Month",
    bullets: ["All MT5 indicators", "Priority setup help", "Prop-firm friendly settings"],
  },
  {
    sku: "mt5_bundle_6m",
    group: "mt5",
    name: "MT5 Indicator Bundle — 6 Months",
    description: "Every MT5 tool in one licence (worth $999).",
    amountCents: 49900,
    term: "6 Months",
    bullets: ["All MT5 indicators", "Priority setup help", "Save vs monthly"],
    badge: "Best value",
  },
  {
    sku: "mt5_bundle_1y",
    group: "mt5",
    name: "MT5 Indicator Bundle — 1 Year",
    description: "Every MT5 tool in one licence (worth $999).",
    amountCents: 99900,
    term: "1 Year",
    bullets: ["All MT5 indicators", "Priority setup help", "Full year of updates"],
  },
  {
    sku: "mt5_bulk_close_1m",
    group: "mt5",
    name: "Bulk Close — BONUS Layer Close (1 Month)",
    description: "Close baskets or single layers of positions in one click.",
    amountCents: 1900,
    term: "1 Month",
    bullets: ["One-click basket close", "Layer-by-layer partial close", "Chart hotkey panel"],
    badge: "Top selling",
  },
  {
    sku: "mt5_bulk_close_6m",
    group: "mt5",
    name: "Bulk Close — BONUS Layer Close (6 Months)",
    description: "Close baskets or single layers of positions in one click.",
    amountCents: 10900,
    term: "6 Months",
    bullets: ["One-click basket close", "Layer close function", "Save vs monthly"],
  },
  {
    sku: "mt5_bulk_close_1y",
    group: "mt5",
    name: "Bulk Close — BONUS Layer Close (1 Year)",
    description: "Close baskets or single layers of positions in one click.",
    amountCents: 19900,
    term: "1 Year",
    bullets: ["One-click basket close", "Layer close function", "Full year of updates"],
  },
  {
    sku: "mt5_drawdown_guardian_1m",
    group: "mt5",
    name: "Drawdown Guardian (1 Month)",
    description: "Hard-stop protection that keeps prop-firm rules intact.",
    amountCents: 900,
    term: "1 Month",
    bullets: ["Daily & total drawdown limits", "Auto flatten on breach", "Live risk readout"],
    badge: "Prop firm favorite",
  },
  {
    sku: "mt5_drawdown_guardian_6m",
    group: "mt5",
    name: "Drawdown Guardian (6 Months)",
    description: "Hard-stop protection that keeps prop-firm rules intact.",
    amountCents: 4900,
    term: "6 Months",
    bullets: ["Daily & total drawdown limits", "Auto flatten on breach", "Save vs monthly"],
  },
  {
    sku: "mt5_drawdown_guardian_1y",
    group: "mt5",
    name: "Drawdown Guardian (1 Year)",
    description: "Hard-stop protection that keeps prop-firm rules intact.",
    amountCents: 9900,
    term: "1 Year",
    bullets: ["Daily & total drawdown limits", "Auto flatten on breach", "Full year of updates"],
  },
  {
    sku: "mt5_auto_tpsl_1m",
    group: "mt5",
    name: "Auto TPSL (1 Month)",
    description: "Automatic take profit and stop loss on every fill.",
    amountCents: 900,
    term: "1 Month",
    bullets: ["Rule-based TP/SL", "Break-even & trailing modes", "Manual or EA trades"],
    badge: "Trending",
  },
  {
    sku: "mt5_auto_tpsl_6m",
    group: "mt5",
    name: "Auto TPSL (6 Months)",
    description: "Automatic take profit and stop loss on every fill.",
    amountCents: 4900,
    term: "6 Months",
    bullets: ["Rule-based TP/SL", "Break-even & trailing modes", "Save vs monthly"],
  },
  {
    sku: "mt5_auto_tpsl_1y",
    group: "mt5",
    name: "Auto TPSL (1 Year)",
    description: "Automatic take profit and stop loss on every fill.",
    amountCents: 9900,
    term: "1 Year",
    bullets: ["Rule-based TP/SL", "Break-even & trailing modes", "Full year of updates"],
  },
  {
    sku: "mt5_currency_strength_1m",
    group: "mt5",
    name: "Currency Strength Meter (1 Month)",
    description: "See which currency is leading before you enter.",
    amountCents: 900,
    term: "1 Month",
    bullets: ["Real-time strength ranking", "Pair-by-pair comparison", "Included in Pro package"],
  },
  {
    sku: "mt5_currency_strength_6m",
    group: "mt5",
    name: "Currency Strength Meter (6 Months)",
    description: "See which currency is leading before you enter.",
    amountCents: 4900,
    term: "6 Months",
    bullets: ["Real-time strength ranking", "Pair-by-pair comparison", "Save vs monthly"],
  },
  {
    sku: "mt5_currency_strength_1y",
    group: "mt5",
    name: "Currency Strength Meter (1 Year)",
    description: "See which currency is leading before you enter.",
    amountCents: 9900,
    term: "1 Year",
    bullets: ["Real-time strength ranking", "Pair-by-pair comparison", "Full year of updates"],
  },
  {
    sku: "mt5_mtf_bias_1m",
    group: "mt5",
    name: "MTF Bias (1 Month)",
    description: "Multi-timeframe direction bias in a single dashboard.",
    amountCents: 900,
    term: "1 Month",
    bullets: ["M1 to D1 bias grid", "Confluence scoring", "Alerts on bias flip"],
  },
  {
    sku: "mt5_mtf_bias_6m",
    group: "mt5",
    name: "MTF Bias (6 Months)",
    description: "Multi-timeframe direction bias in a single dashboard.",
    amountCents: 4900,
    term: "6 Months",
    bullets: ["M1 to D1 bias grid", "Confluence scoring", "Save vs monthly"],
  },
  {
    sku: "mt5_mtf_bias_1y",
    group: "mt5",
    name: "MTF Bias (1 Year)",
    description: "Multi-timeframe direction bias in a single dashboard.",
    amountCents: 9900,
    term: "1 Year",
    bullets: ["M1 to D1 bias grid", "Confluence scoring", "Full year of updates"],
  },

  /* ------------------------------ Macro desk ------------------------------ */
  {
    sku: "macro_full_desk",
    group: "macro",
    name: "Full Macro Desk",
    description: "All four premium heatmaps plus the macro desk digest.",
    amountCents: 1900,
    term: "1 Month",
    bullets: [
      "Central bank divergence heatmap",
      "Recession probability heatmap",
      "Gold futures roll calendar",
      "Daily macro digest",
    ],
    badge: "Macro bestseller",
  },
  {
    sku: "macro_addon",
    group: "macro",
    name: "Macro Add-on (single card)",
    description: "One premium card: news sentiment, whale alerts, options flow or Fed watch.",
    amountCents: 900,
    term: "1 Month",
    bullets: ["Pick any single premium card", "Delivered in the MacroTrader bot", "Cancel any time"],
  },
  {
    sku: "macro_yield_optimizer",
    group: "macro",
    name: "Yield Optimizer",
    description: "Stablecoin and treasury yield routing signals.",
    amountCents: 1200,
    term: "1 Month",
    bullets: ["Best-yield venue tracking", "Risk-adjusted comparison", "Weekly rebalance note"],
  },
];

export function getCatalogItem(sku: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.sku === sku);
}

export function itemsByGroup(group: CatalogGroup): CatalogItem[] {
  return CATALOG.filter((item) => item.group === group);
}

export function formatUsd(amountCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
  }).format(amountCents / 100);
}
