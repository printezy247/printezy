/**
 * Push EzyAI autopilot signals to printezy.money's live board.
 *
 * Mirrors docs/ezyai_signal_client.py with no dependencies (Node 18+ / browsers).
 *
 *   EZYAI_SIGNAL_KEY=... node docs/ezyai_signal_client.js
 *
 * Three calls cover a trade and are safe to repeat: the site merges on
 * `external_id`, so a retry updates the card instead of duplicating it.
 */

const SITE = process.env.EZYMAP_SITE_URL ?? "https://printezy.money";
const PATH = "/api/public/ezyai/signals";
const KEY = process.env.EZYAI_SIGNAL_KEY ?? "";

async function push(payload, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(`${SITE}${PATH}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${KEY}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return { ok: true, data: await res.json() };
    } catch (error) {
      if (attempt === retries) {
        console.error("[ezyai] push failed", error);
        return { ok: false, error };
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return { ok: false };
}

export const openSignal = (externalId, symbol, direction, levels) =>
  push({ external_id: externalId, symbol, direction, status: "running", ...levels });

export const tick = (externalId, price) => push({ external_id: externalId, last_price: price });

export const closeSignal = (externalId, status, result) =>
  push({ external_id: externalId, status, ...result });

// Example (runs only when executed directly, not when imported):
if (import.meta.url === `file://${process.argv[1]}`) {
  await openSignal("auto-8842", "XAUUSD", "buy", {
    entry_low: 4590.2,
    entry_high: 4593.0,
    stop_price: 4585.0,
    tp1: 4604.0,
    tp2: 4612.0,
    rr: 2.4,
    setup_score: 82,
  });
}
