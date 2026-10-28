import type { Locale } from "@/lib/locale-constants";

export type LocalCurrency = "MYR" | "INR" | "SAR";
export type FxQuotes = Partial<Record<LocalCurrency, number>>;

const LOCALE_CURRENCIES: Partial<Record<Locale, LocalCurrency>> = {
  ms: "MYR",
  hi: "INR",
  ar: "SAR",
};

const LOCALE_TAGS: Record<LocalCurrency, string> = {
  MYR: "ms-MY",
  INR: "hi-IN",
  SAR: "ar-SA",
};

/** Convert a USD catalog amount using daily reference quotes, not checkout rates. */
export function formatLocalPriceEstimate(
  amountCents: number,
  locale: Locale,
  quotes: FxQuotes,
): string | undefined {
  const currency = LOCALE_CURRENCIES[locale];
  const rate = currency ? quotes[currency] : undefined;
  if (!currency || typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return;

  return new Intl.NumberFormat(LOCALE_TAGS[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format((amountCents / 100) * rate);
}

export function parseUsdFxQuotes(payload: unknown): { date: string; quotes: FxQuotes } | null {
  if (!Array.isArray(payload)) return null;
  const quotes: FxQuotes = {};
  let date: string | undefined;

  for (const row of payload) {
    if (!row || typeof row !== "object") return null;
    const record = row as Record<string, unknown>;
    if (record.base !== "USD" || typeof record.date !== "string") return null;
    if (date && date !== record.date) return null;
    date = record.date;
    if (record.quote === "MYR" || record.quote === "INR" || record.quote === "SAR") {
      if (typeof record.rate !== "number" || !Number.isFinite(record.rate) || record.rate <= 0)
        return null;
      quotes[record.quote] = record.rate;
    }
  }

  if (!date || !quotes.MYR || !quotes.INR || !quotes.SAR) return null;
  return { date, quotes };
}
