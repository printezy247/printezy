// Client-safe Telegram deep links.

export const REGISTER_BOT = "@EzyRegisterBot";
export const REGISTER_BOT_URL = "https://t.me/ezyregisterbot";

/** The macro desk is a different bot with its own catalogue and no deep links. */
export const MACRO_BOT_URL = "https://t.me/xaubtcmacro_bot";

/** Deep link that opens the register bot with a start payload. */
export function botStartLink(payload: string): string {
  return `${REGISTER_BOT_URL}?start=${payload}`;
}

/** Free (Vantage activation) route into the register bot. */
export const FREE_ACCESS_LINK = botStartLink("free_en");

/** Lifetime products: signal packages and TradingView indicators. */
export function lifetimePayload(sku: string): string {
  return `buy_en_lifetime_${sku}`;
}

export type Mt5Term = "1m" | "6m" | "1y";

/** MT5 products are termed: buy_en_<term>_<product>. */
export function mt5Payload(product: string, term: Mt5Term): string {
  return `buy_en_${term}_${product}`;
}
