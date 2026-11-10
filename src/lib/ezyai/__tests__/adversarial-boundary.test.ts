import { describe, it, expect } from "vitest";
import { progressPercent, entryMid, liveR } from "@/lib/ezyai/signals";

describe("adversarial boundaries", () => {
  it("nulls for every missing leg", () => {
    expect(progressPercent(null, 100, 200, "buy")).toBeNull();
    expect(progressPercent(150, null, 200, "buy")).toBeNull();
    expect(progressPercent(150, 100, null, "buy")).toBeNull();
    expect(progressPercent(undefined, 100, 200, "buy")).toBeNull();
  });
  it("rejects zero/negative spans (stop==target, inverted)", () => {
    expect(progressPercent(150, 100, 100, "buy")).toBeNull();
    expect(progressPercent(150, 200, 100, "buy")).toBeNull(); // bearish span inverted
    expect(progressPercent(150, 100, 200, "sell")).toBeNull(); // wrong direction span
  });
  it("clamps overruns to [0,100]", () => {
    expect(progressPercent(1000, 100, 200, "buy")).toBe(100);
    expect(progressPercent(0, 100, 200, "buy")).toBe(0);
    expect(progressPercent(50, 200, 100, "sell")).toBe(100); // deep ITM short
    expect(progressPercent(250, 200, 100, "sell")).toBe(0); // above stop
    expect(progressPercent(50, 100, 200, "sell")).toBeNull(); // inverted short setup
  });
  it("NaN/Infinity inputs never render", () => {
    expect(progressPercent(NaN, 100, 200, "buy")).toBeNull();
    expect(progressPercent(150, 100, Infinity, "buy")).toBeNull();
  });
  it("entryMid prefers fill, then mid, then single bound", () => {
    expect(entryMid({ entryFill: 5, entryLow: 1, entryHigh: 3 })).toBe(5);
    expect(entryMid({ entryFill: null, entryLow: 1, entryHigh: 3 })).toBe(2);
    expect(entryMid({ entryFill: null, entryLow: null, entryHigh: 3 })).toBe(3);
    expect(entryMid({ entryFill: null, entryLow: null, entryHigh: null })).toBeNull();
  });
  it("liveR null on missing legs and zero risk", () => {
    const base = {
      id: "t",
      externalId: "t",
      sourceChannelId: null,
      sourceMessageId: null,
      symbol: "XAUUSD",
      direction: "buy",
      status: "running",
      setup: null,
      timeframe: null,
      stopPrice: 100,
      tp1: 200,
      tp2: null,
      rr: null,
      setupScore: null,
      lastPrice: 110,
      resultPips: null,
      resultR: null,
      note: null,
      openedAt: "2026-01-01T00:00:00Z",
      closedAt: null,
      updatedAt: "2026-01-01T00:00:00Z",
    } as const;
    expect(liveR({ ...base, entryLow: null, entryHigh: null, entryFill: null })).toBeNull();
    expect(liveR({ ...base, entryLow: 100, entryHigh: 100, entryFill: null })).toBeNull(); // zero risk
    const r = liveR({ ...base, entryLow: 105, entryHigh: 105, entryFill: null });
    expect(r).toBeCloseTo(1, 5); // (110-105)/5
  });
});
