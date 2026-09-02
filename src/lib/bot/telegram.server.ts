// Server-only Telegram Bot API helpers, routed through the Lovable connector
// gateway (the gateway injects the bot token — we never handle it directly).

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function gatewayHeaders() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": TELEGRAM_API_KEY,
    "Content-Type": "application/json",
  };
}

export async function telegramCall(
  method: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  const response = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: gatewayHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`[telegram] ${method} failed [${response.status}]: ${text}`);
    return { ok: false, error: `${response.status}: ${text}` };
  }

  const json = JSON.parse(text) as { ok: boolean; result?: unknown; description?: string };
  if (!json.ok) {
    console.error(`[telegram] ${method} returned not-ok: ${json.description}`);
    return { ok: false, error: json.description ?? "unknown error" };
  }
  return { ok: true, result: json.result };
}

export type InlineButton = { text: string; callback_data?: string; url?: string };

export async function sendMessage(
  chatId: number,
  text: string,
  keyboard?: InlineButton[][],
) {
  return telegramCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return telegramCall("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

/**
 * Secret shared between setWebhook and our webhook route. Derived from the
 * connection key so both sides compute the same value without a new secret.
 */
export async function deriveWebhookSecret(): Promise<string> {
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");
  const bytes = new TextEncoder().encode(`telegram-webhook:${TELEGRAM_API_KEY}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return base64url(new Uint8Array(digest));
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
