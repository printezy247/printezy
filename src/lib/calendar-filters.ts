import type { CalendarRow, Impact } from "./macro-desk";

export const CALENDAR_IMPACTS = ["high", "medium", "low", "holiday"] as const;
export const CALENDAR_CATEGORIES = [
  [
    "calendar_category_central_banks",
    /rate decision|interest rate|monetary policy|central bank|bank of |\b(?:fomc|ecb|fed|boe|rba|rbnz|snb|boj|boc)\b/i,
  ],
  [
    "calendar_category_employment",
    /payroll|unemployment|employment|jobless|job openings|claimant|wages/i,
  ],
  ["calendar_category_inflation", /inflation|\b(?:cpi|ppi|pce)\b|price index|price deflator/i],
  ["calendar_category_housing", /housing|home sales|house price|building permits|mortgage/i],
  [
    "calendar_category_growth",
    /\bgdp\b|\bpmi\b|trade balance|retail sales|industrial production|durable goods|consumer confidence/i,
  ],
] as const;

export type CalendarCategory = (typeof CALENDAR_CATEGORIES)[number][0] | "calendar_category_other";

export function calendarCategory(event: string): CalendarCategory {
  return (
    CALENDAR_CATEGORIES.find(([, match]) => match.test(event))?.[0] ?? "calendar_category_other"
  );
}

export function filterCalendarRows(
  rows: CalendarRow[],
  filters: {
    impacts: Set<Impact>;
    excludedCurrencies: Set<string>;
    search: string;
    category: CalendarCategory | "";
  },
) {
  const search = filters.search.trim().toLowerCase();
  return rows.filter(
    (row) =>
      filters.impacts.has(row.impact) &&
      !filters.excludedCurrencies.has(row.currency) &&
      (!filters.category || calendarCategory(row.event) === filters.category) &&
      `${row.event} ${row.currency}`.toLowerCase().includes(search),
  );
}
