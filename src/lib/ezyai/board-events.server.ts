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
