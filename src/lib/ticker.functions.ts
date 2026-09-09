import { createServerFn } from "@tanstack/react-start";
import type { TickerPayload } from "./ticker.server";

export type { Quote, TickerPayload } from "./ticker.server";

/**
 * Quotes for the header ticker. Public: it is the same data anyone can read off
 * a chart, and gating it would only mean the header is empty until you sign in.
 */
export const getTicker = createServerFn({ method: "GET" }).handler(
  async (): Promise<TickerPayload> => {
    try {
      const { loadTicker } = await import("./ticker.server");
      return await loadTicker();
    } catch (error) {
      console.error("[ticker] load failed", error);
      return { quotes: [], asOf: null };
    }
  },
);
