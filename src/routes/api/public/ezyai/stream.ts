import { createFileRoute } from "@tanstack/react-router";
import { openBoardStream } from "@/lib/ezyai/board-stream.server";

/**
 * GET /api/public/ezyai/stream — server-sent events for the public board.
 *
 * Public and read-only, like the board itself: every frame is a revision
 * stamp the page would have polled for anyway, never signal data. The bridge
 * POST nudges it, and a 5s revision read inside the stream keeps the promise
 * honest when the push was handled by a different process. See
 * docs/ezyai-signal-bridge.md.
 */
export const Route = createFileRoute("/api/public/ezyai/stream")({
  server: {
    handlers: {
      GET: ({ request }) => openBoardStream(request),
    },
  },
});
