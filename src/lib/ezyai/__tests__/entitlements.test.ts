import { describe, it, expect, vi } from "vitest";
import { normalizeRedeemCode, REDEEM_CODE_RE } from "../redeem-code";
import { CLOSED_STATUSES } from "../signals";

// --- redeem-code.ts: normalizeRedeemCode ---

describe("normalizeRedeemCode()", () => {
  it("passes through a well-formed code unchanged", () => {
    expect(normalizeRedeemCode("EZY-ABCD-1234")).toBe("EZY-ABCD-1234");
  });

  it("accepts a 3-group code", () => {
    expect(normalizeRedeemCode("EZY-ABCD-1234-EF56")).toBe("EZY-ABCD-1234-EF56");
  });

  it("accepts code without the EZY prefix", () => {
    expect(normalizeRedeemCode("ABCD-1234")).toBe("EZY-ABCD-1234");
  });

  it("accepts code with EZY prefix and no dash", () => {
    expect(normalizeRedeemCode("EZYABCD1234")).toBe("EZY-ABCD-1234");
  });

  it("strips underscores and whitespace", () => {
    expect(normalizeRedeemCode("EZY_ABCD 1234")).toBe("EZY-ABCD-1234");
  });

  it("folds O → 0 and I → 1 before lookup, as the bot does", () => {
    // O folds to 0 — if input has a literal 0, it stays 0 (not folded back to O).
    expect(normalizeRedeemCode("EZY-OBCD-1234")).toBe("EZY-0BCD-1234");
    expect(normalizeRedeemCode("EZY-ABCD-I234")).toBe("EZY-ABCD-1234");
  });

  it("returns null for a non-string", () => {
    expect(normalizeRedeemCode(12345)).toBeNull();
    expect(normalizeRedeemCode(null)).toBeNull();
    expect(normalizeRedeemCode(undefined)).toBeNull();
  });

  it("returns null for codes that are too short", () => {
    expect(normalizeRedeemCode("EZY-ABC-123")).toBeNull();
  });

  it("returns null for codes that are too long", () => {
    expect(normalizeRedeemCode("EZY-ABCD-1234-EF56-7890")).toBeNull();
  });

  it("returns null for codes with a body length that is not a multiple of 4", () => {
    expect(normalizeRedeemCode("EZY-ABCDE-1234")).toBeNull();
  });

  it("returns null for codes with forbidden characters", () => {
    expect(normalizeRedeemCode("EZY-!@#$-1234")).toBeNull();
  });

  it("returns null for codes with lowercase that do not fold to valid chars", () => {
    // lowercase 'o' → 'O' → '0', 'i' → 'I' → '1', but 'z' stays 'z' which is valid
    expect(normalizeRedeemCode("ezy-abcd-1234")).toBe("EZY-ABCD-1234");
  });
});

describe("REDEEM_CODE_RE", () => {
  it("matches a valid 2-group code", () => {
    expect(REDEEM_CODE_RE.test("EZY-ABCD-1234")).toBe(true);
  });

  it("matches a valid 3-group code", () => {
    expect(REDEEM_CODE_RE.test("EZY-ABCD-1234-EF56")).toBe(true);
  });

  it("accepts codes with 0 and 1 (they are in [A-Z0-9] after O→0/I→1 folding)", () => {
    expect(REDEEM_CODE_RE.test("EZY-0BCD-1234")).toBe(true);
    expect(REDEEM_CODE_RE.test("EZY-A1VD-1234")).toBe(true);
  });
});

// --- signals.ts: CLAIMED_STATUSES import surface ---

describe("CLOSED_STATUSES exists as a named export", () => {
  it("is a non-empty readonly array of strings", () => {
    expect(Array.isArray(CLOSED_STATUSES)).toBe(true);
    expect(CLOSED_STATUSES.length).toBeGreaterThan(0);
    for (const s of CLOSED_STATUSES) {
      expect(typeof s).toBe("string");
    }
  });
});
