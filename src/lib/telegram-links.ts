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
