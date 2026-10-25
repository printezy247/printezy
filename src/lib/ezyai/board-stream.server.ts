import { subscribeBoardRevision } from "./board-events.server";

/**
 * Server-sent events for the public board.
 *
 * The stream carries one thing: the board's revision stamp. It is a doorbell,
 * not a data channel — the page still fetches the signals through its own
 * server function, so the board keeps exactly one source of truth and the
 * stream never has to serialise a signal.
 *
 * Two paths feed it, on purpose:
 *   - the revision bus, which fires the instant a bridge POST lands in this
 *     process (sub-second for the common case);
 *   - a periodic revision read, which is what makes the sub-30s promise hold
 *     when the push was handled somewhere else (another isolate, another
 *     dyno) or the bus event was missed.
 *
 * The page's 30s poll stays underneath both for a client whose stream never
 * connects at all.
 */

export type BoardStreamTiming = {
  /** How often the stream re-reads the revision itself. */
  tickMs?: number;
  /** Comment frame that stops proxies closing an idle stream. */
  heartbeatMs?: number;
  /** Reconnect ceiling — a long-lived socket pins a process for no gain. */
  maxConnectionMs?: number;
};

const DEFAULTS: Required<BoardStreamTiming> = {
  tickMs: 5_000,
  heartbeatMs: 20_000,
  maxConnectionMs: 10 * 60_000,
};

/** Read the current stamp, treating an unconfigured database as "unknown". */
async function readRevision(): Promise<string | null> {
  try {
    const { latestSignalUpdate } = await import("./signals.server");
    return await latestSignalUpdate();
  } catch (error) {
    console.error("[ezyai-stream] revision read failed", error);
    return null;
  }
}

export async function openBoardStream(
  request: Request,
  timing: BoardStreamTiming = {},
): Promise<Response> {
  // `??`, not a spread: a caller passing only `tickMs` must keep the other
  // defaults, or the expiry becomes `setTimeout(fn, undefined)` — a 0ms close.
  const tickMs = timing.tickMs ?? DEFAULTS.tickMs;
  const heartbeatMs = timing.heartbeatMs ?? DEFAULTS.heartbeatMs;
  const maxConnectionMs = timing.maxConnectionMs ?? DEFAULTS.maxConnectionMs;

  // Read the baseline before the first frame: a visitor arriving mid-trade is
  // told what the page already shows instead of being made to refetch it.
  const baseline = await readRevision();

  const encoder = new TextEncoder();
  let stop = () => {};

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let last = baseline;
      let unsubscribe = () => {};
      // Held in an object: `finish` clears them, they need `write`, and `write`
      // needs `finish` — so none of the three can be declared strictly first.
      const timers: {
        tick?: ReturnType<typeof setInterval>;
        beat?: ReturnType<typeof setInterval>;
        expiry?: ReturnType<typeof setTimeout>;
      } = {};

      const finish = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        if (timers.tick) clearInterval(timers.tick);
        if (timers.beat) clearInterval(timers.beat);
        if (timers.expiry) clearTimeout(timers.expiry);
        request.signal.removeEventListener("abort", finish);
        try {
          controller.close();
        } catch {
          // Already closed (client vanished mid-write) — nothing to do.
        }
      };
      stop = finish;

      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          finish();
        }
      };
      const frame = (event: string, data: unknown) =>
        write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      /** Only ever announce a stamp the client does not already have. */
      const emit = (stamp: string | null) => {
        if (stamp === null || stamp === last) return;
        last = stamp;
        frame("revision", { updatedAt: stamp });
      };

      frame("ready", { updatedAt: baseline });
      unsubscribe = subscribeBoardRevision(emit);

      timers.tick = setInterval(() => {
        void readRevision().then(emit);
      }, tickMs);
      timers.beat = setInterval(() => write(": keep-alive\n\n"), heartbeatMs);
      timers.expiry = setTimeout(finish, maxConnectionMs);

      request.signal.addEventListener("abort", finish, { once: true });
      if (request.signal.aborted) finish();
    },
    cancel() {
      // The reader went away without an abort (or before one arrived).
      stop();
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      // A cached stream would replay yesterday's doorbell.
      "cache-control": "no-store, no-transform",
      // nginx and friends buffer by default, which holds frames until close.
      "x-accel-buffering": "no",
    },
  });
}
