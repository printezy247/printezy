/**
 * Constant-time string comparison, used wherever a secret bearer key is checked
 * against an expected value (Telegram webhook secrets, EzyAI bridge keys, Stripe
 * webhook signatures).
 *
 * A naive `!==` short-circuits on the first mismatched byte, which lets an
 * attacker narrow down the correct secret one character at a time by measuring
 * response times. This XORs every character pair regardless of early mismatches
 * and returns only the final boolean, so timing leaks no positional info.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
