import { SITE_URL } from "@/lib/bot/tiers";
import { EBOOK_PAGES } from "@/lib/ebooks";

/**
 * /llms.txt — a short, human- and machine-readable summary for AI answer
 * engines. Generated from the same data the site renders (the ebook list comes
 * straight from EBOOK_PAGES), so it can never go stale. No fabricated dates.
 */
export function buildLlmsTxt(): string {
  const ebooks = EBOOK_PAGES.map(
    (b) => `- ${SITE_URL}/ebooks/${b.slug} — ${b.title}: ${b.tagline}`,
  ).join("\n");
  return `# EzyMap ALGO

> EzyMap ALGO is a trading desk that lives inside Telegram: real-time trading
> signals, a macro desk, free ebooks and an AI analyst. The website at
> ${SITE_URL} is the public front door for the desk.

## What it offers
- Real-time trading signals for forex, gold, crypto and major indices, delivered to Telegram.
- Free ebooks on market mapping and technical analysis.
- TradingView and MetaTrader 5 indicators.
- The MacroTrader desk: economic calendar, fear & greed and price levels.
- EzyAI: an AI analyst inside Telegram.

## Key URLs
- ${SITE_URL}/ — free Telegram signals landing page (English)
- ${SITE_URL}/home — full site (English)
- ${SITE_URL}/ms — full site (Bahasa Melayu)
- ${SITE_URL}/indicators — TradingView and MT5 indicators
- ${SITE_URL}/macro — macro desk
- ${SITE_URL}/faq — frequently asked questions
${ebooks}

This file is generated from the same data the site renders and is never hand-edited.
`;
}

/**
 * /.well-known/security.txt — RFC 9116 security policy. Expires is computed at
 * request time (one year out) so the file is always valid instead of silently
 * going stale like a hand-written one.
 */
export function buildSecurityTxt(now: Date = new Date()): string {
  const expires = new Date(now);
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  return `# EzyMap ALGO security policy
Contact: mailto:support@printezy.money
Contact: https://t.me/EzySarah
Expires: ${expires.toISOString()}
Canonical: ${SITE_URL}/.well-known/security.txt
Policy: ${SITE_URL}/terms
Preferred-Languages: en, ms
Clearance: none
`;
}
