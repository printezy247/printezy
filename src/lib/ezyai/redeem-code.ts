// EzyAI PRO redeem codes: EZY-XXXX-XXXX.
//
// Minted when an EzyAI checkout session is created and stored on the Stripe
// session (metadata + payment description) so the success page, the Stripe
// receipt and the entitlement row all carry the same code. The buyer types it
// into @ezytradeai_bot with /redeem; the bot normalizes user input the same
// way `normalizeRedeemCode` does (app/site_entitlements.py in
// tradernonymous/EzyAi), so the two must stay in step.
//
// The alphabet has no O/I (the bot folds them to 0/1 before lookup) and no
// 0/1 either, so a code can never be mis-read from a printed receipt.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 symbols → 5 bits each
const GROUPS = 2;
const GROUP_LEN = 4;

/** Canonical wire format: optional EZY- prefix, 2 or 3 groups of 4. */
export const REDEEM_CODE_RE = /^EZY-[A-Z0-9]{4}-[A-Z0-9]{4}(?:-[A-Z0-9]{4})?$/;

export function generateRedeemCode(): string {
  const bytes = new Uint8Array(GROUPS * GROUP_LEN);
  crypto.getRandomValues(bytes);
  let body = "";
  for (const b of bytes) body += ALPHABET[b & 31];
  return "EZY-" + body.match(/.{4}/g)!.join("-");
}

/**
 * Turn whatever a person typed into the canonical code, or null when it can't
 * be one. Mirrors the bot: strip whitespace/underscores, uppercase, O→0, I→1,
 * optional EZY prefix, dashes optional, body of 8 or 12 alphanumerics.
 */
export function normalizeRedeemCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.replace(/[\s_]/g, "").toUpperCase().replace(/O/g, "0").replace(/I/g, "1");
  let body = raw.startsWith("EZY-") ? raw.slice(4) : raw.startsWith("EZY") ? raw.slice(3) : raw;
  body = body.replace(/-/g, "");
  if (body.length < 8 || body.length > 12 || body.length % 4 !== 0) return null;
  if (!/^[A-Z0-9]+$/.test(body)) return null;
  const code = "EZY-" + body.match(/.{4}/g)!.join("-");
  return REDEEM_CODE_RE.test(code) ? code : null;
}
