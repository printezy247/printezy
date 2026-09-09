import { createFileRoute } from "@tanstack/react-router";

/**
 * Manual and scheduled trigger for the website's own autopilot.
 *
 *   GET /api/public/ezyai/autopilot            → the last few runs (no auth)
 *   POST /api/public/ezyai/autopilot           → run now (bearer key)
 *
 * The board already ticks the desk on every visit, so this exists for the two
 * cases a page load cannot cover: proving from outside that the engine works,
 * and letting an external scheduler keep the board moving through a quiet hour
 * when nobody is looking.
 *
 * The GET is unauthenticated on purpose and reports only counts and the run's
 * own notes — never a key, never a payload.
 */

function normalise(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  const quoted =
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")));
  return quoted ? value.slice(1, -1).trim() : value;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/ezyai/autopilot")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { recentRuns } = await import("@/lib/ezyai/autopilot.server");
          const runs = await recentRuns(5);
          return Response.json({ ever_ran: runs.length > 0, recent_runs: runs });
        } catch (error) {
          console.error("[ezyai autopilot] could not read runs", error);
          return Response.json({ error: "could not read the run log" }, { status: 500 });
        }
      },

      POST: async ({ request }) => {
        const key =
          normalise(process.env.EZYAI_SIGNAL_KEY) || normalise(process.env.EZYAI_ENTITLEMENT_KEY);
        if (!key) {
          return Response.json({ error: "no trigger key configured" }, { status: 503 });
        }
        const header = request.headers.get("authorization") ?? "";
        const presented = normalise(header.startsWith("Bearer ") ? header.slice(7) : "");
        if (!presented || !safeEqual(presented, key)) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        try {
          const { runAutopilot } = await import("@/lib/ezyai/autopilot.server");
          // Forced: a scheduler asking for a pass means it wants one now.
          return Response.json(await runAutopilot(true));
        } catch (error) {
          console.error("[ezyai autopilot] run failed", error);
          return Response.json({ error: "run failed" }, { status: 500 });
        }
      },
    },
  },
});
