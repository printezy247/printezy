import { describe, it, expect, vi, beforeEach } from "vitest";

// Same harness as the signals route test: createFileRoute becomes identity
// so the raw server handlers can be called with plain Requests.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: unknown) => config,
}));

const listClosedSignals = vi.fn();
vi.mock("@/lib/ezyai/signals.server", () => ({
  listClosedSignals: (...args: unknown[]) => listClosedSignals(...args),
}));

import { Route } from "../ledger";

type Handler = (ctx: { request: Request }) => Promise<Response>;
const handlers = (Route as unknown as { server: { handlers: { GET: Handler } } }).server.handlers;

beforeEach(() => {
  listClosedSignals.mockReset();
});

describe("GET /api/public/ezyai/ledger", () => {
  it("returns the era start, count and newest-first rows", async () => {
    const rows = [
      { id: "s2", status: "sl", resultR: -1 },
      { id: "s1", status: "tp", resultR: 2.4 },
    ];
    listClosedSignals.mockResolvedValue(rows);
    const res = await handlers.GET({
      request: new Request("http://local.test/api/public/ezyai/ledger"),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      since: string;
      count: number;
      signals: unknown[];
    };
    expect(body.since).toBe("2026-10-28T00:00:00Z");
    expect(body.count).toBe(2);
    expect(body.signals).toEqual(rows);
  });

  it("500s without leaking internals when the database is down", async () => {
    listClosedSignals.mockRejectedValue(new Error("db down"));
    const res = await handlers.GET({
      request: new Request("http://local.test/api/public/ezyai/ledger"),
    });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "lookup failed" });
  });
});
