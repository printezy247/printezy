/**
 * Master switch for the public signal board at `/ezyai`.
 *
 * On: the route renders, the nav item shows, the hero card and the closing
 * band link to the board, and `/ezyai` is listed in the sitemap. Off: the
 * route redirects home and every link falls back to the Telegram bot, so the
 * site reads as if the board never was. Nothing is deleted to hide it — this
 * flag is the whole mechanism, both ways.
 *
 * The board no longer runs any scanning of its own. Every card on it was
 * pushed by the EzyAi bot (autopilot opens and watch alerts alike, live data
 * only), so showing or hiding the site can no longer starve a feed — the
 * board's freshness is exactly the bot's.
 *
 * Typed as `boolean` rather than left to infer: a literal type would narrow
 * every branch that reads it and let the compiler quietly drop the code that
 * has to run on the other side of the flag.
 */
export const EZYAI_BOARD_VISIBLE: boolean = true;
