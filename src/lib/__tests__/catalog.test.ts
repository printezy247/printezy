import { describe, expect, it } from "vitest";
import { CATALOG, EZYAI_SKU_MONTHS, formatUsd, getCatalogItem, isEzyAiSku } from "@/lib/catalog";

describe("catalog", () => {
  it("finds only known purchasable SKUs", () => {
    expect(getCatalogItem("signal_beginner")?.amountCents).toBe(2900);
    expect(getCatalogItem("mt5_bundle_6m")?.term).toBe("6 Months");
    expect(getCatalogItem("not-a-real-sku")).toBeUndefined();
  });

  it("keeps every catalog price a non-negative integer amount in cents", () => {
    expect(CATALOG.length).toBeGreaterThan(0);
    for (const item of CATALOG) {
      expect(Number.isSafeInteger(item.amountCents), item.sku).toBe(true);
      expect(item.amountCents, item.sku).toBeGreaterThanOrEqual(0);
    }
  });

  it("formats USD whole-dollar and fractional prices consistently", () => {
    expect(formatUsd(2900)).toBe("$29");
    expect(formatUsd(1499)).toBe("$14.99");
    expect(formatUsd(0)).toBe("$0");
  });

  it("identifies EzyAI terms from the entitlement map", () => {
    expect(EZYAI_SKU_MONTHS.ezyai_pro_1m).toBe(1);
    expect(EZYAI_SKU_MONTHS.ezyai_pro_6m).toBe(6);
    expect(isEzyAiSku("ezyai_pro_1y")).toBe(true);
    expect(isEzyAiSku("signal_beginner")).toBe(false);
    expect(isEzyAiSku(null)).toBe(false);
  });
});
