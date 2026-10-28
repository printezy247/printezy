import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EZYAI_MIN_TRACK_RECORD_SAMPLE,
  EZYAI_TRACK_RECORD_SINCE,
  buildingTrackRecord,
} from "@/lib/ezyai/signals";

/**
 * The track record was reset on 28 Oct for the upgraded bot: the
 * Yahoo-scanner rows are voided in the database, the pre-upgrade bot era
 * (25–27 Oct) no longer counts, and a small sample must not masquerade as
 * a win rate. These tests pin that contract down.
 */

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

describe("track-record window", () => {
  it("counts from the upgraded bot era, not from the scanner, bridge tests, or pre-upgrade bot", () => {
    expect(EZYAI_TRACK_RECORD_SINCE.startsWith("2026-10-28")).toBe(true);
    // Scanner era (Sep), the one-morning bridge test batch (15 Oct,
    // ids ezyai-812..821, ticks frozen), and the pre-upgrade bot era
    // (25–27 Oct) are all before the upgraded bot era.
    expect(Date.parse(EZYAI_TRACK_RECORD_SINCE)).toBeGreaterThan(Date.parse("2026-10-27"));
  });

  it("the closed-signals query actually applies the window", () => {
    const server = read("../../lib/ezyai/signals.server.ts");
    const fn = server.slice(server.indexOf("export async function listClosedSignals"));
    expect(fn).toContain('.gte("opened_at", EZYAI_TRACK_RECORD_SINCE)');
    expect(server).toContain("EZYAI_TRACK_RECORD_SINCE");
  });
});

describe("small-sample guard", () => {
  it("needs ten closed trades before a rate is shown", () => {
    expect(EZYAI_MIN_TRACK_RECORD_SAMPLE).toBe(10);
    expect(buildingTrackRecord(0)).toBe(false); // empty state owns zero
    expect(buildingTrackRecord(1)).toBe(true);
    expect(buildingTrackRecord(EZYAI_MIN_TRACK_RECORD_SAMPLE - 1)).toBe(true);
    expect(buildingTrackRecord(EZYAI_MIN_TRACK_RECORD_SAMPLE)).toBe(false);
  });
});

describe("panel honours the guard", () => {
  const panel = read("../../components/ezyai/PerformancePanel.tsx");

  it("shows a building notice instead of rate tiles for a small sample", () => {
    expect(panel).toContain("buildingTrackRecord");
    expect(panel).toContain("ezyai_sig_building");
  });

  it("states the era the numbers come from", () => {
    expect(panel).toContain("ezyai_sig_since");
    expect(panel).toContain("EZYAI_TRACK_RECORD_SINCE");
  });

  it("does not claim a win rate while building", () => {
    // The win-rate Metric must sit after the building branch returns early
    // from that block, i.e. be guarded — not rendered unconditionally.
    const guard = panel.indexOf("buildingTrackRecord(performance.total)");
    const winRate = panel.indexOf("ezyai_sig_winrate");
    expect(guard).toBeGreaterThan(-1);
    expect(winRate).toBeGreaterThan(guard);
  });
});

describe("copy exists in every locale and never promises results", () => {
  const src = read("../translations.ts");
  const locales = ["en:", "ms:", "zh:", "hi:", "ar:", "sw:"] as const;

  it.each(locales)("locale %s carries both keys", (locale) => {
    const start = src.indexOf(`\n  ${locale}`);
    const end = src.indexOf("\n  }", start);
    const block = src.slice(start, end);
    expect(block).toContain("ezyai_sig_since");
    expect(block).toContain("ezyai_sig_building");
  });

  it("the English strings keep their placeholders", () => {
    const since = src.slice(src.indexOf("ezyai_sig_since"), src.indexOf("ezyai_sig_building"));
    expect(since).toContain("{date}");
    expect(src.slice(src.indexOf("ezyai_sig_building"))).toContain("{closed}");
  });

  it("no fabricated-floor wording anywhere near the record", () => {
    // The agreed contract is honest display: nothing may promise a floor.
    expect(src).not.toMatch(/win rate.{0,80}(guarantee|maintained|at least)/i);
    expect(src).not.toMatch(/(guarantee|maintained|at least).{0,80}win rate/i);
  });
});
