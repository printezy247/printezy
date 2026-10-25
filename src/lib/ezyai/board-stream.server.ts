import { reserveBoardStream, subscribeBoardRevision } from "./board-events.server";

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

const encoder = new TextEncoder();

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

const frame = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * One connection: the ready frame, then whatever stamp the bus or the tick
 * produces, until the reader leaves or the ceiling passes. Returns its
 * teardown, which is safe to call more than once.
 */
function runStream(
  controller: ReadableStreamDefaultController<Uint8Array>,
  signal: AbortSignal,
  baseline: string | null,
  timing: Required<BoardStreamTiming>,
  release: () => void,
): () => void {
  let last = baseline;
  let closed = false;
  let unsubscribe = () => {};
  const stoppers: Array<() => void> = [];

  const write = (chunk: string) => {
    if (closed) return;
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      // The reader vanished between frames — the teardown is the same.
      close();
    }
  };

  /** Only ever announce a stamp the client does not already have. */
  const emit = (stamp: string | null) => {
    if (stamp === null || stamp === last) return;
    last = stamp;
    write(frame("revision", { updatedAt: stamp }));
  };

  function close() {
    if (closed) return;
    closed = true;
    unsubscribe();
    for (const stop of stoppers) stop();
    signal.removeEventListener("abort", close);
    release();
    try {
      controller.close();
    } catch {
      // Already closed by the platform — nothing to do.
    }
  }

  // The baseline goes out first, before the bus is subscribed, so a push can
  // never slip in front of the frame that tells the client what it has.
  write(frame("ready", { updatedAt: baseline }));
  if (closed) return close;

  unsubscribe = subscribeBoardRevision(emit);
  const tick = setInterval(() => void readRevision().then(emit), timing.tickMs);
  const beat = setInterval(() => write(": keep-alive\n\n"), timing.heartbeatMs);
  const expiry = setTimeout(close, timing.maxConnectionMs);
  stoppers.push(
    () => clearInterval(tick),
    () => clearInterval(beat),
    () => clearTimeout(expiry),
  );

  signal.addEventListener("abort", close, { once: true });
  if (signal.aborted) close();

  return close;
}

export async function openBoardStream(
  request: Request,
  timing: BoardStreamTiming = {},
): Promise<Response> {
  const release = reserveBoardStream();
  if (!release) {
    // Over the cap: the page's 30s poll still works, so a client refused here
    // loses freshness, not the board.
    return new Response("the board is at capacity; keep polling", {
      status: 503,
      headers: { "retry-after": "15", "cache-control": "no-store" },
    });
  }

  // `??` per field, not a spread: a caller passing only `tickMs` must keep the
  // other defaults, or the expiry becomes `setTimeout(fn, undefined)`.
  const resolved: Required<BoardStreamTiming> = {
    tickMs: timing.tickMs ?? DEFAULTS.tickMs,
    heartbeatMs: timing.heartbeatMs ?? DEFAULTS.heartbeatMs,
    maxConnectionMs: timing.maxConnectionMs ?? DEFAULTS.maxConnectionMs,
  };

  // Read the baseline before the first frame: a visitor arriving mid-trade is
  // told what the page already shows instead of being made to refetch it.
  const baseline = await readRevision();
  let dispose = release;

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      dispose = runStream(controller, request.signal, baseline, resolved, release);
    },
    cancel() {
      dispose();
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
