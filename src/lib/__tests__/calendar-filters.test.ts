import { describe, expect, it } from "vitest";
import { CALENDAR_IMPACTS, filterCalendarRows } from "../calendar-filters";
import type { CalendarRow } from "../macro-desk";

const rows: CalendarRow[] = [
  { currency: "USD", event: "Core CPI m/m", impact: "high" },
  { currency: "EUR", event: "Unemployment Rate", impact: "medium" },
  { currency: "USD", event: "Bank Holiday", impact: "holiday" },
].map((row) => ({
  ...row,
  nyTime: "08:30",
  actual: "N/A",
  forecast: "N/A",
  previous: "N/A",
})) as CalendarRow[];

const defaults = {
  impacts: new Set(CALENDAR_IMPACTS),
  excludedCurrencies: new Set<string>(),
  search: "",
  category: "" as const,
};

describe("economic calendar filters", () => {
  it("combines currency, category and case-insensitive search", () => {
    expect(
      filterCalendarRows(rows, {
        ...defaults,
        excludedCurrencies: new Set(["EUR"]),
        category: "calendar_category_inflation",
        search: " CPI ",
      }),
    ).toEqual([rows[0]]);
  });

  it("treats holidays independently and does not reselect excluded currencies", () => {
    expect(filterCalendarRows(rows, { ...defaults, impacts: new Set(["holiday"]) })).toEqual([
      rows[2],
    ]);
    expect(
      filterCalendarRows(rows, { ...defaults, excludedCurrencies: new Set(["USD", "EUR"]) }),
    ).toEqual([]);
  });
});
