import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BOARD_REVISION_QUERY_KEY } from "./signals";

/**
 * The bridge wakes the board instead of the board waiting for its clock.
 *
 * The stream carries only the revision stamp, written into the same query the
 * 30s poll owns, so the board refetches because its query key includes the
 * stamp. The poll stays underneath — a blocked stream, an offline tab or a
 * push handled by another server process all fall back to it.
 *
 * Returns whether the doorbell is currently connected. That is what the reader
 * sees as "Live updates" or the polling fallback; it is deliberately not a
 * promise of freshness, because the poll runs either way.
 */
export function useBoardStream(): boolean {
  const queryClient = useQueryClient();
  const [streamLive, setStreamLive] = useState(false);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    let source: EventSource | null = null;
    let retry: number | undefined;
    let disposed = false;

    const onRevision = (event: MessageEvent<string>) => {
      setStreamLive(true);
      try {
        const { updatedAt } = JSON.parse(event.data) as { updatedAt?: string | null };
        // No stamp means the push landed but the revision read did not — ask
        // the poll's own query rather than inventing a value.
        if (!updatedAt) {
          void queryClient.invalidateQueries({ queryKey: BOARD_REVISION_QUERY_KEY });
          return;
        }
        queryClient.setQueryData(BOARD_REVISION_QUERY_KEY, { updatedAt });
      } catch {
        // A malformed frame is not worth breaking the board over; the poll wins.
      }
    };

    const connect = () => {
      if (disposed) return;
      const next = new EventSource("/api/public/ezyai/stream");
      source = next;
      next.addEventListener("ready", () => setStreamLive(true));
      next.addEventListener("revision", onRevision as EventListener);
      next.onerror = () => {
        // A refused stream (503 at the cap, an offline proxy) would otherwise
        // be reopened by the browser on its own schedule and never recover the
        // only thing the reader can act on. Close it, say so, fall back to the
        // poll, and knock again in a minute.
        setStreamLive(false);
        next.close();
        if (source === next) source = null;
        retry = window.setTimeout(connect, 60_000);
      };
    };

    connect();
    return () => {
      disposed = true;
      if (retry) window.clearTimeout(retry);
      source?.close();
    };
  }, [queryClient]);

  return streamLive;
}
