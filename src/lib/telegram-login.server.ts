// Verification for Telegram's Login Widget.
//
// The widget hands the browser a payload describing who signed in. Anyone can
// forge one, so it is worth nothing until the signature is checked here.
// Telegram signs it with HMAC-SHA256 keyed on SHA256(bot_token), which means
// this file needs the raw bot token — unlike the rest of the bot code, where
// the Lovable connector gateway holds the token and we never see it. Hence a
// secret of its own.
//
// Two manual steps are what make the button work at all:
//
//   1. BotFather → /setdomain → printezy.money, for the bot named below.
//      Without it Telegram refuses to render the button on our pages.
//   2. TELEGRAM_LOGIN_BOT_TOKEN set to that same bot's token.
//      Without it every sign-in is rejected right here.
//
// Both are checked at runtime rather than assumed: the button is not offered
// unless the token is present, and a payload that fails the signature is
// treated as a forgery, not as a configuration problem.

/** The bot the login button belongs to, and whose /setdomain must be set. */
const DEFAULT_BOT_USERNAME = "EzyRegisterBot";

/**
 * How long a signed payload stays usable. Telegram never expires these, so
 * without a window one captured payload would be replayable forever.
 */
const MAX_AGE_MS = 15 * 60 * 1000;

export type TelegramLoginUser = {
  id: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  authDate: number;
};

export function loginBotUsername(): string {
  const configured = (process.env.TELEGRAM_LOGIN_BOT_USERNAME ?? "").trim().replace(/^@+/, "");
  return configured || DEFAULT_BOT_USERNAME;
}

/** The button is only offered when a sign-in could actually be verified. */
export function loginConfigured(): boolean {
  return Boolean((process.env.TELEGRAM_LOGIN_BOT_TOKEN ?? "").trim());
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compares in constant time so a wrong hash can't be narrowed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Checks a Login Widget payload and returns the Telegram account it proves,
 * or null if it proves nothing. Every rejection is silent to the caller by
 * design — a forged payload and an expired one look the same from outside.
 */
export async function verifyTelegramLogin(
  payload: Record<string, string>,
): Promise<TelegramLoginUser | null> {
  const token = (process.env.TELEGRAM_LOGIN_BOT_TOKEN ?? "").trim();
  if (!token) {
    console.error("[telegram-login] TELEGRAM_LOGIN_BOT_TOKEN is not set — cannot verify sign-ins");
    return null;
  }

  const { hash, ...fields } = payload;
  if (!hash) return null;

  // Telegram's data-check-string: every field except the hash, sorted by key,
  // one "key=value" per line. The values must be byte-for-byte what Telegram
  // sent, which is why the widget payload reaches us as strings.
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  const encoder = new TextEncoder();
  const secret = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dataCheckString));
  if (!safeEqual(toHex(signature), hash.trim().toLowerCase())) return null;

  const authDate = Number(fields.auth_date);
  if (!Number.isFinite(authDate)) return null;
  if (Date.now() - authDate * 1000 > MAX_AGE_MS) return null;

  const id = Number(fields.id);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const username = (fields.username ?? "").trim().replace(/^@+/, "");
  const photoUrl = (fields.photo_url ?? "").trim();

  return {
    id,
    firstName: (fields.first_name ?? "").trim().slice(0, 120),
    lastName: (fields.last_name ?? "").trim().slice(0, 120) || null,
    username: /^[A-Za-z0-9_]{3,32}$/.test(username) ? username : null,
    photoUrl: photoUrl.startsWith("https://") ? photoUrl.slice(0, 500) : null,
    authDate,
  };
}
