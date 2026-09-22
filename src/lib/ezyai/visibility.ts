/**
 * Whether the public signal board at `/ezyai` is reachable.
 *
 * Hidden on purpose while the Telegram bot is being updated. Nothing behind it
 * is deleted — the route, the components, the server functions and the signal
 * history are all left standing — so bringing the board back is this one line
 * rather than a revert.
 *
 * Two things follow from hiding it that are easy to miss:
 *
 *  - The autopilot's scan is triggered by the board's own load. With the route
 *    blocked nothing loads it, so the autopilot stops scanning on its own and
 *    writes no new signals. That is the intended behaviour here, not an
 *    oversight; the history already collected stays put.
 *  - Every link into the board is gated on this flag rather than removed, so
 *    the nav item, the hero card's call to action, the closing band and the
 *    product card all come back together when it flips.
 *
 * Typed as `boolean` rather than left to infer `false`: a literal type would
 * narrow every branch that reads it and let the compiler quietly drop the code
 * that has to run once the board is public again.
 */
export const EZYAI_BOARD_VISIBLE: boolean = false;
