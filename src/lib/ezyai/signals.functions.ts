// What /ezyai reads. Both functions are deliberately public: the signal board
// is the website's exclusive — anyone can watch the desk work, and the PRO
// gate stays where it always was, inside the bot, on the alerts that arrive
// while a trade is still worth taking.
import { createServerFn } from "@tanstack/react-start";
import type { EzyAiPerformance, EzyAiSignal } from "./signals";

export type EzyAiBoard = {
  signals: EzyAiSignal[];
  /** Newest update across the board, for the "as of" line. */
  updatedAt: string | null;
};

export type EzyAiHistory = {
  signals: EzyAiSignal[];
  performance: EzyAiPerformance;
};

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

export const getEzyAiHistory = createServerFn({ method: "GET" }).handler(
  async (): Promise<EzyAiHistory> => {
    const { listClosedSignals } = await import("./signals.server");
    const { summarisePerformance } = await import("./signals");
    const signals = await listClosedSignals();
    return { signals, performance: summarisePerformance(signals) };
  },
);
