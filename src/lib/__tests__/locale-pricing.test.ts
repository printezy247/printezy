import { describe, expect, it } from "vitest";
import { formatLocalPriceEstimate, parseUsdFxQuotes } from "@/lib/locale-pricing";

const validRates = [
  { base: "USD", quote: "MYR", rate: 4.7, date: "2026-10-27" },
  { base: "USD", quote: "INR", rate: 88, date: "2026-10-27" },
  { base: "USD", quote: "SAR", rate: 3.75, date: "2026-10-27" },
];

describe("localized price estimates", () => {
  it("accepts complete positive USD quotes only", () => {
    expect(parseUsdFxQuotes(validRates)).toEqual({
      date: "2026-10-27",
      quotes: { MYR: 4.7, INR: 88, SAR: 3.75 },
    });
    expect(parseUsdFxQuotes(validRates.slice(0, 2))).toBeNull();
    expect(parseUsdFxQuotes(validRates.map((row) => ({ ...row, rate: 0 })))).toBeNull();
  });

  it("formats reference estimates for Malay, Hindi and Arabic only", () => {
    const rates = { MYR: 4.7, INR: 88, SAR: 3.75 };
    // ms-MY renders MYR as "RM" — assert the real locale symbol, not the ISO code.
    expect(formatLocalPriceEstimate(2900, "ms", rates)).toContain("RM");
    expect(formatLocalPriceEstimate(2900, "hi", rates)).toContain("₹");
    expect(formatLocalPriceEstimate(2900, "ar", rates)).toContain("ر.س");
    expect(formatLocalPriceEstimate(2900, "en", rates)).toBeUndefined();
    expect(formatLocalPriceEstimate(2900, "ms", {})).toBeUndefined();
  });
});
