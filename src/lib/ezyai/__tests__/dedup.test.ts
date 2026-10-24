import { describe, it, expect } from "vitest";
import { findLiveDuplicate, type LiveLike } from "../dedup";

/**
 * The bot now pushes watch alerts as well as autopilot signals, and a watch
 * fires per subscriber — two PRO users watching the same pair in the same
 * style are the same call. The board must show one card, not one per chat, so
 * a new push that matches a live card folds into it. This is that matcher:
 * pure, no database, the query around it stays thin.
 */

const NOW = "2026-10-25T12:00:00.000Z";

function live(over: Partial<LiveLike> = {}): LiveLike {
  return {
    symbol: "XAUUSD",
    direction: "buy",
    setup: "Intraday · Normal risk · 15m",
    status: "running",
    openedAt: "2026-10-25T10:00:00.000Z",
    ...over,
  };
}

const SAME = { symbol: "XAUUSD", direction: "buy", setup: "Intraday · Normal risk · 15m" };

describe("findLiveDuplicate", () => {
  it("folds an identical new signal into the live card it duplicates", () => {
    const rows = [live()];
    expect(findLiveDuplicate(rows, SAME, NOW)).toBe(rows[0]);
  });

  it("ignores case in the symbol, as the store uppercases it", () => {
    expect(findLiveDuplicate([live()], { ...SAME, symbol: "xauusd" }, NOW)).not.toBeNull();
  });

  it("keeps a different style or risk setup as its own card", () => {
    expect(
      findLiveDuplicate([live()], { ...SAME, setup: "Swing · Safe risk · 4h" }, NOW),
    ).toBeNull();
  });

  it("keeps the opposite direction on the same pair", () => {
    expect(findLiveDuplicate([live()], { ...SAME, direction: "sell" }, NOW)).toBeNull();
  });

  it("never folds into a card that is not live", () => {
    for (const status of ["tp", "be", "sl", "cancelled"]) {
      expect(findLiveDuplicate([live({ status })], SAME, NOW)).toBeNull();
    }
  });

  it("stops folding once the window is past — a fresh call two days on is fresh", () => {
    const old = live({ openedAt: "2026-10-23T10:00:00.000Z" });
    expect(findLiveDuplicate([old], SAME, NOW)).toBeNull();
  });

  it("measures the window from the incoming open when the push carries one", () => {
    const incoming = { ...SAME, openedAt: "2026-10-23T10:00:00.000Z" };
    // The live card is recent; the new call is two days before it. Same pair,
    // same setup, but these are not the same trade.
    expect(findLiveDuplicate([live()], incoming, NOW)).toBeNull();
    const twoDaysAgo = live({ openedAt: "2026-10-23T11:00:00.000Z" });
    expect(findLiveDuplicate([twoDaysAgo], incoming, NOW)).toBe(twoDaysAgo);
  });

  it("does not guess a direction it was not given", () => {
    expect(findLiveDuplicate([live()], { symbol: "XAUUSD", setup: SAME.setup }, NOW)).toBeNull();
  });
});
