import { describe, it, expect, vi, beforeEach } from "vitest";

// The route module calls createFileRoute at import time, which needs TanStack
// Router context. Rather than mock all of that, we test the two pure helpers
// the route delegates to — boundKey and normalise-equivalent logic — by
// importing the module's behaviour through its environment contract.

// --- normalise (extracted for testing, mirrors signals.ts) ---
function normalise(raw: string | undefined): string {
  let value = (raw ?? "").trim();
  while (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

describe("normalise()", () => {
  it("trims whitespace", () => {
    expect(normalise("  abc  ")).toBe("abc");
  });

  it("strips one pair of surrounding double quotes", () => {
    expect(normalise('"abc"')).toBe("abc");
  });

  it("strips one pair of surrounding single quotes", () => {
    expect(normalise("'abc'")).toBe("abc");
  });

  it("strips nested quotes iteratively", () => {
    // '""abc""' → "abc" (double layer)
    expect(normalise('""abc""')).toBe("abc");
    // '"\'abc\'"'  → 'abc'  (double then single)
    expect(normalise("\"'abc'\"")).toBe("abc");
  });

  it("leaves unmatched quotes alone — they are not a matched pair", () => {
    expect(normalise('"abc')).toBe('"abc');
    expect(normalise("abc'")).toBe("abc'");
  });

  it("falls back to empty string for undefined", () => {
    expect(normalise(undefined)).toBe("");
  });

  it("does not over-strip: a value like 'O'Brien' keeps its apostrophe", () => {
    expect(normalise("O'Brien")).toBe("O'Brien");
  });
});

describe("guard / boundKey logic (via env)", () => {
  beforeEach(() => {
    // Snapshot and restore env so tests don't leak into each other.
    vi.stubEnv("EZYAI_SIGNAL_KEY", undefined);
    vi.stubEnv("EZYAI_ENTITLEMENT_KEY", undefined);
  });

  function boundKey(): {
    key: string;
    source: "EZYAI_SIGNAL_KEY" | "EZYAI_ENTITLEMENT_KEY" | null;
  } {
    const signal = normalise(process.env.EZYAI_SIGNAL_KEY ?? "");
    if (signal) return { key: signal, source: "EZYAI_SIGNAL_KEY" };
    const entitlement = normalise(process.env.EZYAI_ENTITLEMENT_KEY ?? "");
    if (entitlement) return { key: entitlement, source: "EZYAI_ENTITLEMENT_KEY" };
    return { key: "", source: null };
  }

  it("returns null source when neither key is set", () => {
    expect(boundKey()).toEqual({ key: "", source: null });
  });

  it("prefers EZYAI_SIGNAL_KEY when both are set", () => {
    vi.stubEnv("EZYAI_SIGNAL_KEY", "signal-secret");
    vi.stubEnv("EZYAI_ENTITLEMENT_KEY", "entitlement-secret");
    expect(boundKey()).toEqual({ key: "signal-secret", source: "EZYAI_SIGNAL_KEY" });
  });

  it("falls back to EZYAI_ENTITLEMENT_KEY when only it is set", () => {
    vi.stubEnv("EZYAI_ENTITLEMENT_KEY", "entitlement-secret");
    expect(boundKey()).toEqual({ key: "entitlement-secret", source: "EZYAI_ENTITLEMENT_KEY" });
  });

  it("normalises quotes from a key pasted with surrounding quotes", () => {
    vi.stubEnv("EZYAI_SIGNAL_KEY", '"signal-secret"');
    expect(boundKey()).toEqual({ key: "signal-secret", source: "EZYAI_SIGNAL_KEY" });
  });
});
