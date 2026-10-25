/**
 * Board revision bus — the accelerator under the live stream.
 *
 * The bridge and the stream usually share a server process, so a push can
 * nudge every open stream the moment it lands instead of waiting for the
 * stream's next database tick. It is deliberately *not* the source of truth:
 * a POST handled by another process or isolate publishes into a bus nobody
 * here is listening to, and the stream's own revision read covers that. The
 * page keeps its 30s poll underneath both.
 */

export type BoardRevisionListener = (updatedAt: string | null) => void;

const listeners = new Set<BoardRevisionListener>();

/** Register a listener. The returned function is safe to call more than once. */
export function subscribeBoardRevision(listener: BoardRevisionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Tell every open stream the board moved. A push must never fail because a
 * subscriber did, so a throwing listener is logged and the rest still run.
 */
export function publishBoardRevision(updatedAt: string | null): void {
  for (const listener of [...listeners]) {
    try {
      listener(updatedAt);
    } catch (error) {
      console.error("[ezyai-board] revision listener failed", error);
    }
  }
}

/** How many streams are attached — used by tests and diagnostics. */
export function boardRevisionListenerCount(): number {
  return listeners.size;
}

/**
 * How many streams one process will hold at once. Every stream costs a
 * database read every few seconds, and the endpoint is public, so an unbounded
 * one is a free way to make the board expensive. The cap is per process: on a
 * platform that runs several isolates it bounds each of them, not the fleet.
 */
const MAX_STREAMS = 100;

let openStreams = 0;

/**
 * Reserve one stream slot, or `null` when this process is already at the cap.
 *
 * The returned release is idempotent: a stream can end because its reader
 * left, its request aborted, or its connection ceiling passed, and only the
 * first of those may give the slot back.
 */
export function reserveBoardStream(): (() => void) | null {
  if (openStreams >= MAX_STREAMS) return null;
  openStreams += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openStreams -= 1;
  };
}

/** How many stream slots this process is holding — tests and diagnostics. */
export function boardStreamCount(): number {
  return openStreams;
}
