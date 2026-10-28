import { createFileRoute } from "@tanstack/react-router";
import { EZYAI_TRACK_RECORD_SINCE } from "@/lib/ezyai/signals";

/**
 * GET /api/public/ezyai/ledger — the full closed-trade ledger, newest
 * first. Public and read-only, like the board: the same rows the
 * Performance tab summarises, downloadable so anyone can check the
 * aggregate. Sealed outcomes (see signals.server.ts) mean a row never
 * changes after it closes — an export taken today matches one taken
 * next month plus the new closes.
 */
export const Route = createFileRoute("/api/public/ezyai/ledger")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { listClosedSignals } = await import("@/lib/ezyai/signals.server");
          const signals = await listClosedSignals(500);
          return Response.json({
            since: EZYAI_TRACK_RECORD_SINCE,
            count: signals.length,
            signals,
          });
        } catch (error) {
          console.error("[ezyai ledger] lookup failed", error);
          return Response.json({ error: "lookup failed" }, { status: 500 });
        }
      },
    },
  },
});
