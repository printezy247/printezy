import { describe, expect, it } from "vitest";
import { generateReferralCode } from "@/lib/referral.functions";

describe("generateReferralCode()", () => {
  it("mints 8 unambiguous symbols", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    }
  });

  it("mints distinct codes", () => {
    const codes = new Set(Array.from({ length: 1000 }, generateReferralCode));
    expect(codes.size).toBe(1000);
  });
});
