import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The route module calls createFileRoute at import time, which needs a router
// context. Mock it to identity so importing the module yields the raw config
// (with server.handlers) we can call directly with plain Request objects.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: unknown) => config,
}));

// The handlers dynamically import signals.server; mock it so no database is
// touched and each test controls the per-signal outcome.
const pushSignal = vi.fn();
const listLiveSignals = vi.fn();
const recordBridgeHit = vi.fn();
const recentBridgeHits = vi.fn(async (_limit?: number) => []);
vi.mock("@/lib/ezyai/signals.server", () => ({
  pushSignal: (entry: Record<string, unknown>) => pushSignal(entry),
  listLiveSignals: () => listLiveSignals(),
  recordBridgeHit: (outcome: string, meta: unknown) => recordBridgeHit(outcome, meta),
  recentBridgeHits: (limit: number) => recentBridgeHits(limit),
}));

import { Route } from "../signals";

type Handler = (ctx: { request: Request }) => Promise<Response>;
const handlers = (
  Route as unknown as { server: { handlers: { GET: Handler; POST: Handler } } }
).server.handlers;

const KEY = "test-signal-key";

function post(body: unknown, bearer: string = KEY): Promise<Response> {
  return handlers.POST({
    request: new Request("http://local.test/api/public/ezyai/signals", {
      method: "POST",
      headers: {
        authorization: `Bearer ${bearer}`,
        "content-type": "application/json",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

function get(query = "", bearer: string = KEY): Promise<Response> {
  return handlers.GET({
    request: new Request(`http://local.test/api/public/ezyai/signals${query}`, {
      headers: { authorization: `Bearer ${bearer}` },
    }),
  });
}

beforeEach(() => {
  vi.stubEnv("EZYAI_SIGNAL_KEY", KEY);
  vi.stubEnv("EZYAI_ENTITLEMENT_KEY", "");
  pushSignal.mockReset().mockResolvedValue({ ok: true });
  listLiveSignals.mockReset().mockResolvedValue([]);
  recordBridgeHit.mockReset();
  recentBridgeHits.mockReset().mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("guard", () => {
  it("503 when neither key variable is bound", async () => {
    vi.stubEnv("EZYAI_SIGNAL_KEY", "");
    vi.stubEnv("EZYAI_ENTITLEMENT_KEY", "");
    const res = await post({ external_id: "x" });
    expect(res.status).toBe(503);
    expect(pushSignal).not.toHaveBeenCalled();
  });

  it("401 with fingerprints on a wrong key", async () => {
    const res = await post({ external_id: "x" }, "wrong-key");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.compared_against).toBe("EZYAI_SIGNAL_KEY");
    expect(body.expected_fingerprint).toMatch(/^[0-9a-f]{8}$/);
    expect(body.presented_fingerprint).toMatch(/^[0-9a-f]{8}$/);
    expect(body.expected_fingerprint).not.toBe(body.presented_fingerprint);
    expect(recordBridgeHit).toHaveBeenCalledWith("unauthorized", expect.anything());
  });

  it("401 when no bearer token is presented at all", async () => {
    const res = await post({ external_id: "x" }, "");
    expect(res.status).toBe(401);
  });

  it("falls back to EZYAI_ENTITLEMENT_KEY when the signal key is unset", async () => {
    vi.stubEnv("EZYAI_SIGNAL_KEY", "");
    vi.stubEnv("EZYAI_ENTITLEMENT_KEY", "fallback-key");
    const res = await post({ external_id: "x" }, "fallback-key");
    expect(res.status).toBe(200);
  });

  it("accepts a bearer token pasted with surrounding quotes", async () => {
    const res = await post({ external_id: "x" }, `"${KEY}"`);
    expect(res.status).toBe(200);
  });
});

describe("POST", () => {
  it("400 on a body that is not JSON", async () => {
    const res = await post("not json{");
    expect(res.status).toBe(400);
  });

  it("400 on an empty batch", async () => {
    const res = await post({ signals: [] });
    expect(res.status).toBe(400);
    expect(pushSignal).not.toHaveBeenCalled();
  });

  it("400 when the batch exceeds 50, without pushing anything", async () => {
    const res = await post({
      signals: Array.from({ length: 51 }, (_, i) => ({ external_id: `s${i}` })),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("50");
    expect(pushSignal).not.toHaveBeenCalled();
  });

  it("200 when a single signal is accepted", async () => {
    const res = await post({ external_id: "s1", symbol: "EURUSD" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(1);
    expect(pushSignal).toHaveBeenCalledWith(
      expect.objectContaining({ external_id: "s1", symbol: "EURUSD" }),
    );
  });

  it("207 on a mixed batch — one bad row must not lose the rest", async () => {
    pushSignal
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, error: "missing symbol" });
    const res = await post({ signals: [{ external_id: "a" }, { external_id: "b" }] });
    expect(res.status).toBe(207);
    const body = await res.json();
    expect(body.accepted).toBe(1);
    expect(body.results).toHaveLength(2);
  });

  it("400 when nothing in the batch is accepted", async () => {
    pushSignal.mockResolvedValue({ ok: false, error: "nope" });
    const res = await post({ signals: [{ external_id: "a" }] });
    expect(res.status).toBe(400);
  });

  it("marks non-object entries per-signal without calling pushSignal for them", async () => {
    const res = await post({ signals: ["junk", { external_id: "ok" }] });
    const body = await res.json();
    expect(body.results[0]).toEqual({ ok: false, error: "each signal must be an object" });
    expect(pushSignal).toHaveBeenCalledTimes(1);
  });
});

describe("GET", () => {
  it("lists live signals behind the same guard", async () => {
    listLiveSignals.mockResolvedValue([{ id: "s1" }]);
    const res = await get();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signals).toEqual([{ id: "s1" }]);
  });

  it("500 with a generic error when the lookup throws", async () => {
    listLiveSignals.mockRejectedValue(new Error("db down"));
    const res = await get();
    expect(res.status).toBe(500);
  });

  it("diagnose=1 reports configuration state and empty traffic", async () => {
    const res = await get("?diagnose=1");
    const body = await res.json();
    expect(body.configured).toBe(true);
    expect(body.compared_against).toBe("EZYAI_SIGNAL_KEY");
    expect(body.ever_called).toBe(false);
  });

  it("diagnose=1 is refused without the key, like every GET", async () => {
    const res = await get("?diagnose=1", "wrong");
    expect(res.status).toBe(401);
  });
});
