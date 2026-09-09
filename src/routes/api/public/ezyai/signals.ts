import { createFileRoute } from "@tanstack/react-router";

/**
 * Signal bridge for @ezytradeai_bot (tradernonymous/EzyAi).
 *
 *   GET  /api/public/ezyai/signals              → { signals } still on the board
 *   GET  /api/public/ezyai/signals?diagnose=1   → which key is bound (no auth)
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

type KeySource = "EZYAI_SIGNAL_KEY" | "EZYAI_ENTITLEMENT_KEY" | null;

/**
 * Secrets reach us through dashboard fields and shell variables, and both are
 * happy to carry the punctuation around a value into it. Trim, then drop one
 * matched pair of surrounding quotes: a key pasted as "abc" is meant to be
 * abc, and the difference between the two is invisible in every UI that shows
 * it back to you.
 */
function normalise(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  const quoted =
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")));
  return quoted ? value.slice(1, -1).trim() : value;
}

/** The key the guard will compare against, and which variable it came from. */
function boundKey(): { key: string; source: KeySource } {
  const signal = normalise(process.env.EZYAI_SIGNAL_KEY);
  if (signal) return { key: signal, source: "EZYAI_SIGNAL_KEY" };
  const entitlement = normalise(process.env.EZYAI_ENTITLEMENT_KEY);
  if (entitlement) return { key: entitlement, source: "EZYAI_ENTITLEMENT_KEY" };
  return { key: "", source: null };
}

/**
 * First four bytes of SHA-256, in hex. Enough to say "these two secrets are
 * not the same one" in a bug report; 32 bits of a digest is far too little to
 * work backwards from, and a colliding string still fails the real comparison.
 */
async function fingerprint(value: string): Promise<string> {
  if (!value) return "none";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest).slice(0, 4))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time compare so a wrong key can't be narrowed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Record an attempt, and never let that recording matter.
 *
 * Importing the server module constructs the Supabase admin client, which
 * throws when the database is unconfigured or unreachable — so the import has
 * to sit inside the try as much as the call does. A bridge that cannot write
 * its log still has to answer 401 with a 401.
 */
async function logAttempt(
  outcome: "accepted" | "partial" | "rejected" | "unauthorized" | "not_configured" | "bad_request",
  meta: { externalId?: string | null; detail?: string | null; userAgent?: string | null } = {},
): Promise<void> {
  try {
    const { recordBridgeHit } = await import("@/lib/ezyai/signals.server");
    recordBridgeHit(outcome, meta);
  } catch (error) {
    console.error("[ezyai signals] could not record the attempt", error);
  }
}

async function guard(request: Request, log: boolean): Promise<Response | null> {
  const ua = request.headers.get("user-agent");
  const { key, source } = boundKey();
  if (!key) {
    if (log) await logAttempt("not_configured", { userAgent: ua });
    return Response.json(
      {
        error: "signal bridge not configured",
        hint: "neither EZYAI_SIGNAL_KEY nor EZYAI_ENTITLEMENT_KEY is bound to the deployed site",
      },
      { status: 503 },
    );
  }
  const header = request.headers.get("authorization") ?? "";
  const presented = normalise(header.startsWith("Bearer ") ? header.slice(7) : "");
  if (!presented || !safeEqual(presented, key)) {
    if (log) {
      await logAttempt("unauthorized", {
        userAgent: ua,
        detail: presented ? "key mismatch" : "no bearer token",
      });
    }
    // A bare 401 cannot tell "wrong secret" from "right secret, but the
    // fallback variable is the one actually bound" — and the two have
    // opposite fixes. Name the variable compared and a truncated digest of
    // each side: it ends the guessing without putting a secret in a response.
    return Response.json(
      {
        error: "unauthorized",
        compared_against: source,
        expected_fingerprint: await fingerprint(key),
        presented_fingerprint: await fingerprint(presented),
      },
      { status: 401 },
    );
  }
  return null;
}

/**
 * Unauthenticated on purpose: it exists for the case where authentication is
 * exactly what is broken, and it says only whether each variable is bound and
 * a 32-bit digest of the winner — never a value, never a length.
 */
async function diagnose(): Promise<Response> {
  const { key, source } = boundKey();
  const signal = normalise(process.env.EZYAI_SIGNAL_KEY);
  const entitlement = normalise(process.env.EZYAI_ENTITLEMENT_KEY);
  // The question a bound key cannot answer: has anything actually called?
  let recent: unknown[] = [];
  try {
    const { recentBridgeHits } = await import("@/lib/ezyai/signals.server");
    recent = await recentBridgeHits(5);
  } catch (error) {
    console.error("[ezyai signals] diagnose could not read the bridge log", error);
  }
  return Response.json({
    configured: Boolean(key),
    compared_against: source,
    signal_key_present: Boolean(signal),
    entitlement_key_present: Boolean(entitlement),
    expected_fingerprint: await fingerprint(key),
    // The two secrets are separate on purpose — pushing signals and redeeming
    // paid entitlements are different privileges — but nothing stops someone
    // pasting one value into both fields, and then rotating one leaves the
    // other still carrying the old secret. That is invisible from outside and
    // exactly the kind of thing you want to find out before you rely on it.
    entitlement_fingerprint: await fingerprint(entitlement),
    keys_identical: Boolean(signal) && signal === entitlement,
    // Empty means nothing has ever called this endpoint — which is a different
    // problem from being called and refused, and has a different fix.
    ever_called: recent.length > 0,
    recent_attempts: recent,
  });
}

const MAX_BATCH = 50;

export const Route = createFileRoute("/api/public/ezyai/signals")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Before the guard, deliberately: this is the one question you still
        // need answered when the guard is the thing refusing you.
        if (new URL(request.url).searchParams.get("diagnose") === "1") {
          return diagnose();
        }
        const denied = await guard(request, false);
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
        const denied = await guard(request, true);
        if (denied) return denied;
        try {
          const ua = request.headers.get("user-agent");
          const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          if (!body || typeof body !== "object") {
            await logAttempt("bad_request", { userAgent: ua, detail: "not a JSON object" });
            return Response.json({ error: "expected a JSON object" }, { status: 400 });
          }

          const batch = Array.isArray(body.signals) ? body.signals : [body];
          if (batch.length === 0) {
            await logAttempt("bad_request", { userAgent: ua, detail: "empty batch" });
            return Response.json({ error: "no signals in the payload" }, { status: 400 });
          }
          if (batch.length > MAX_BATCH) {
            await logAttempt("bad_request", { userAgent: ua, detail: "batch over the limit" });
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
          const firstId = batch.find((e) => e && typeof e === "object")
            ? String((batch[0] as Record<string, unknown>).external_id ?? "")
            : "";
          await logAttempt(
            accepted === results.length ? "accepted" : accepted === 0 ? "rejected" : "partial",
            {
              userAgent: ua,
              externalId: firstId || null,
              detail: `${accepted}/${results.length} accepted`,
            },
          );
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
