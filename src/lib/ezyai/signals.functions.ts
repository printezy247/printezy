// What /ezyai reads, and nothing else. The board is a mirror: the EzyAi bot
// pushes every live signal (autopilot opens and watch alerts alike) through
// the public bridge, and the site only stores and serves what it is told.
// The old site-side scanner — Yahoo feeds, indicators, its own autopilot —
// was removed when the board became a pure mirror, so loading the board has
// no side effects. Both functions are deliberately public: anyone can watch
// the board, and the PRO gate stays where it always was, inside the bot.
import { createServerFn } from "@tanstack/react-start";
import type { EzyAiPerformance, EzyAiSignal } from "./signals";

export type EzyAiBoard = {
  signals: EzyAiSignal[];
  /** Newest update across the board, for the "as of" line. */
  updatedAt: string | null;
};

export type EzyAiHistory = {
  /**
   * The most recent closes only — what the results list renders. The
   * performance summary is computed over the full closed set server-side,
   * so the panel's numbers never depend on how many rows made the trip.
   */
  signals: EzyAiSignal[];
  performance: EzyAiPerformance;
};

/** How many recent closes the history tab renders in its results list. */
const HISTORY_SHOWN = 30;

export const getEzyAiBoard = createServerFn({ method: "GET" }).handler(
  async (): Promise<EzyAiBoard> => {
    const { listLiveSignals } = await import("./signals.server");
    const signals = await listLiveSignals();
    const updatedAt =
      signals.reduce<string | null>(
        (latest, s) => (latest === null || s.updatedAt > latest ? s.updatedAt : latest),
        null,
      ) ?? null;
    return { signals, updatedAt };
  },
);

/**
 * The board's revision stamp — one max() row instead of the full board.
 * The page polls this on a short timer and only re-pulls the board when the
 * revision moves, so a quiet board costs almost nothing to keep fresh.
 */
export const getEzyAiBoardRevision = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ updatedAt: string | null }> => {
    const { latestSignalUpdate } = await import("./signals.server");
    return { updatedAt: await latestSignalUpdate() };
  },
);

export const getEzyAiHistory = createServerFn({ method: "GET" }).handler(
  async (): Promise<EzyAiHistory> => {
    const { listClosedSignals } = await import("./signals.server");
    const { summarisePerformance } = await import("./signals");
    const signals = await listClosedSignals();
    return {
      signals: signals.slice(0, HISTORY_SHOWN),
      performance: summarisePerformance(signals),
    };
  },
);
