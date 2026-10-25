import { describe, it, expect } from "vitest";
import { safeEqual } from "../secure-compare";

describe("safeEqual", () => {
  it("returns true for identical strings", () => {
    expect(safeEqual("abc123", "abc123")).toBe(true);
  });

  it("returns true for two empty strings", () => {
    expect(safeEqual("", "")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(safeEqual("abc123", "abc124")).toBe(false);
  });

  it("returns false for different lengths without leaking which side differs", () => {
    expect(safeEqual("abc123", "abc1234")).toBe(false);
    expect(safeEqual("abc1234", "abc123")).toBe(false);
  });

  it("handles a mismatch at the first character", () => {
    expect(safeEqual("xbcd", "abcd")).toBe(false);
  });

  it("handles a mismatch at the last character", () => {
    expect(safeEqual("abcx", "abcd")).toBe(false);
  });

  it("handles unicode strings", () => {
    expect(safeEqual("héllo", "héllo")).toBe(true);
    expect(safeEqual("héllo", "hèllo")).toBe(false);
  });
});
