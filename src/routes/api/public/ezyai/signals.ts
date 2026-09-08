import { createFileRoute } from "@tanstack/react-router";

/**
 * Signal bridge for @ezytradeai_bot (tradernonymous/EzyAi).
 *
 *   GET  /api/public/ezyai/signals              → { signals } still on the board
 *   POST /api/public/ezyai/signals  { ...one signal }
 *   POST /api/public/ezyai/signals  { signals: [ ... ] }   (batch, max 50)
 *
 * Auth: `Authorization: Bearer <EZYAI_SIGNAL_KEY>`, falling back to
 * EZYAI_ENTITLEMENT_KEY when no signal-specific key is set — so the bridge
 * works with one secret and can be split onto its own later without a code
 * change. 503 while neither is configured (nothing to compare against), 401
 * on a bad key.
 *
 * Every push is a merge keyed on `external_id`: absent fields keep their
 * current values, so opening, ticking the price and closing are all the same
 * call, and a retry after a crash is harmless. A batch reports per-signal
 * results rather than failing whole, so one malformed row cannot lose the
 * other forty-nine.
 */
function signalKey(): string {
  return (
    (process.env.EZYAI_SIGNAL_KEY ?? "").trim() || (process.env.EZYAI_ENTITLEMENT_KEY ?? "").trim()
  );
}

/** Constant-time compare so a wrong key can't be narrowed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function guard(request: Request): Response | null {
  const key = signalKey();
  if (!key) {
    return Response.json({ error: "signal bridge not configured" }, { status: 503 });
  }
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!presented || !safeEqual(presented, key)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

const MAX_BATCH = 50;

export const Route = createFileRoute("/api/public/ezyai/signals")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = guard(request);
        if (denied) return denied;
        try {
          const { listLiveSignals } = await import("@/lib/ezyai/signals.server");
          return Response.json({ signals: await listLiveSignals() });
        } catch (error) {
          console.error("[ezyai signals] GET failed", error);
          return Response.json({ error: "lookup failed" }, { status: 500 });
        }
      },

      POST: async ({ request }) => {
        const denied = guard(request);
        if (denied) return denied;
        try {
          const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          if (!body || typeof body !== "object") {
            return Response.json({ error: "expected a JSON object" }, { status: 400 });
          }

          const batch = Array.isArray(body.signals) ? body.signals : [body];
          if (batch.length === 0) {
            return Response.json({ error: "no signals in the payload" }, { status: 400 });
          }
          if (batch.length > MAX_BATCH) {
            return Response.json(
              { error: `at most ${MAX_BATCH} signals per request` },
              { status: 400 },
            );
          }

          const { pushSignal } = await import("@/lib/ezyai/signals.server");
          const results = [];
          for (const entry of batch) {
            if (!entry || typeof entry !== "object") {
              results.push({ ok: false, error: "each signal must be an object" });
              continue;
            }
            results.push(await pushSignal(entry as Record<string, unknown>));
          }

          const accepted = results.filter((r) => r.ok).length;
          // 207 when the batch was mixed, so the bot can tell "all landed"
          // from "some landed" without parsing the body.
          const status = accepted === results.length ? 200 : accepted === 0 ? 400 : 207;
          return Response.json({ accepted, results }, { status });
        } catch (error) {
          console.error("[ezyai signals] POST failed", error);
          return Response.json({ error: "push failed" }, { status: 500 });
        }
      },
    },
  },
});
