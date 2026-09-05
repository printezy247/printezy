// Client-safe Telegram deep links.

export const REGISTER_BOT = "@EzyRegisterBot";

/** Deep link that opens the register bot with a start payload. */
export function botStartLink(payload: string): string {
  return `https://t.me/EzyRegisterBot?start=${encodeURIComponent(payload)}`;
}

/** USDT / crypto checkout is handled entirely inside the bot. */
export function usdtBuyLink(sku: string): string {
  return botStartLink(`buy_${sku}`);
}

export const EZYAI_BOT = "@ezytradeai_bot";

/** Deep link that opens EzyAI with a start payload (PRO claim happens on /start). */
export function ezyAiStartLink(payload: string): string {
  return `https://t.me/ezytradeai_bot?start=${encodeURIComponent(payload)}`;
}
