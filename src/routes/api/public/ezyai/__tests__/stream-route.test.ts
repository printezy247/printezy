import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Route modules call createFileRoute at import time; identity keeps the raw
// config so the GET handler can be called with a plain Request.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: unknown) => config,
}));

// The stream reads one column for its revision; no database in tests.
const latestSignalUpdate = vi.fn<() => Promise<string | null>>(async () => null);
vi.mock("@/lib/ezyai/signals.server", () => ({
  latestSignalUpdate: () => latestSignalUpdate(),
}));

import { Route } from "../stream";
import { openBoardStream } from "@/lib/ezyai/board-stream.server";
import { boardRevisionListenerCount, publishBoardRevision } from "@/lib/ezyai/board-events.server";

/**
 * The board's live channel. It carries a revision stamp and nothing else: the
 * page still fetches the board through its own server function, so the stream
 * never becomes a second source of truth.
 */

type Handler = (ctx: { request: Request }) => Promise<Response>;
const handlers = (Route as unknown as { server: { handlers: { GET: Handler } } }).server.handlers;

const STREAM_URL = "http://local.test/api/public/ezyai/stream";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Read `count` SSE frames (split on the blank line), or fail with what we have. */
async function frames(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  count: number,
  timeoutMs = 1_000,
): Promise<string[]> {
  const decoder = new TextDecoder();
  const deadline = Date.now() + timeoutMs;
  const out: string[] = [];
  let buffer = "";
  while (out.length < count) {
    if (Date.now() > deadline) {
      throw new Error(
        `timed out with frames=${JSON.stringify(out)} buffer=${JSON.stringify(buffer)}`,
      );
    }
    const result = await Promise.race([reader.read(), wait(25).then(() => null)]);
    if (result === null) continue;
    if (result.done) break;
    buffer += decoder.decode(result.value, { stream: true });
    const split = buffer.indexOf("\n\n");
    if (split === -1) continue;
    out.push(buffer.slice(0, split));
    buffer = buffer.slice(split + 2);
  }
  return out;
}

/** The frame's `data:` payload, parsed. */
const dataOf = (frame: string) =>
  JSON.parse(
    frame
      .split("\n")
      .find((line) => line.startsWith("data: "))!
      .slice(6),
  );

let controller: AbortController | null = null;

beforeEach(() => {
  latestSignalUpdate.mockReset().mockResolvedValue("2026-10-26T02:00:00.000Z");
});

afterEach(() => {
  controller?.abort();
  controller = null;
  expect(boardRevisionListenerCount()).toBe(0);
});

/** Through the route handler — proves the route is wired to the stream. */
async function openViaRoute() {
  controller = new AbortController();
  const response = await handlers.GET({
    request: new Request(STREAM_URL, { signal: controller.signal }),
  });
  return { response, reader: response.body!.getReader() };
}

/** Straight at the stream, with a test-friendly timer cadence. */
async function openStream(timing: Parameters<typeof openBoardStream>[1]) {
  controller = new AbortController();
  const response = await openBoardStream(
    new Request(STREAM_URL, { signal: controller.signal }),
    timing,
  );
  return { response, reader: response.body!.getReader() };
}

describe("GET /api/public/ezyai/stream", () => {
  it("answers as an event stream, not a cached document", async () => {
    const { response, reader } = await openViaRoute();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toContain("no-store");
    // nginx-style buffers would hold frames until the socket closes.
    expect(response.headers.get("x-accel-buffering")).toBe("no");

    await reader.cancel();
  });

  it("opens with a ready frame carrying the current revision", async () => {
    const { reader } = await openStream({ tickMs: 60_000 });
    const [first] = await frames(reader, 1);

    expect(first).toContain("event: ready");
    expect(dataOf(first)).toEqual({ updatedAt: "2026-10-26T02:00:00.000Z" });

    await reader.cancel();
  });

  it("pushes a revision the moment the bridge publishes one", async () => {
    const { reader } = await openStream({ tickMs: 60_000 });
    await frames(reader, 1); // ready

    publishBoardRevision("2026-10-26T02:01:00.000Z");
    const [next] = await frames(reader, 1);

    expect(next).toContain("event: revision");
    expect(dataOf(next)).toEqual({ updatedAt: "2026-10-26T02:01:00.000Z" });

    await reader.cancel();
  });

  it("does not repeat a stamp the client already has", async () => {
    const { reader } = await openStream({ tickMs: 20 });
    await frames(reader, 1); // ready at 02:00:00, and every tick re-reads it

    publishBoardRevision("2026-10-26T02:00:00.000Z"); // same stamp
    publishBoardRevision("2026-10-26T02:02:00.000Z"); // new stamp
    const [next] = await frames(reader, 1);

    expect(dataOf(next)).toEqual({ updatedAt: "2026-10-26T02:02:00.000Z" });

    await reader.cancel();
  });

  it("catches a revision the hub never saw, on its own tick", async () => {
    // A POST handled by another isolate publishes into a bus nobody here owns;
    // the stream's own read is what makes the latency guarantee real.
    const { reader } = await openStream({ tickMs: 20 });
    await frames(reader, 1); // ready

    latestSignalUpdate.mockResolvedValue("2026-10-26T02:03:00.000Z");
    const [next] = await frames(reader, 1);

    expect(dataOf(next)).toEqual({ updatedAt: "2026-10-26T02:03:00.000Z" });

    await reader.cancel();
  });

  it("unsubscribes when the client goes away", async () => {
    const { reader } = await openStream({ tickMs: 20 });
    await frames(reader, 1);
    expect(boardRevisionListenerCount()).toBe(1);

    await reader.cancel();

    expect(boardRevisionListenerCount()).toBe(0);
  });

  it("unsubscribes when the request is aborted", async () => {
    const { reader } = await openViaRoute();
    await frames(reader, 1);
    expect(boardRevisionListenerCount()).toBe(1);

    controller!.abort();

    expect(boardRevisionListenerCount()).toBe(0);
    await reader.cancel();
  });
});
