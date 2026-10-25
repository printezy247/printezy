import { describe, it, expect, vi, beforeEach } from "vitest";

// The server module constructs the Supabase admin client at import time, so
// the client module must be mocked before the import below is evaluated.
const fromMock = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => fromMock(...args) },
}));

// Stripe is only used to re-fetch the checkout session; mock it per test.
const retrieveSession = vi.fn();
vi.mock("@/lib/stripe.server", () => ({
  createStripeClient: () => ({
    checkout: { sessions: { retrieve: (id: string) => retrieveSession(id) } },
  }),
}));

// site-access.server pulls in the whole bot tree; re-implement the one pure
// helper we need so the import graph stays light.
vi.mock("@/lib/bot/site-access.server", () => ({
  normalizeHandle: (username: string | null | undefined): string | null => {
    if (!username) return null;
    const handle = username.trim().replace(/^@+/, "").toLowerCase();
    return handle.length > 0 ? handle : null;
  },
}));

import {
  claimEntitlement,
  findEntitlementByCode,
  listUnclaimedEntitlements,
  recordEzyAiEntitlement,
} from "../entitlements.server";

type Result = { data: unknown; error: unknown };

/** Chainable query builder: intermediate calls return itself; terminals and a bare await resolve to the canned result. */
function chain(result: Result) {
  const c: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "eq", "is", "order", "limit", "ilike"]) {
    c[m] = vi.fn(() => c);
  }
  c.maybeSingle = vi.fn(async () => result);
  c.single = vi.fn(async () => result);
  c.then = (onFulfilled: unknown, onRejected: unknown) =>
    Promise.resolve(result).then(onFulfilled as never, onRejected as never);
  return c;
}

beforeEach(() => {
  fromMock.mockReset();
  retrieveSession.mockReset();
  // Default: an empty successful result. Tests that care override with
  // mockReturnValueOnce — the default keeps chain-building harmless for
  // early-return paths that construct a query but never await it.
  fromMock.mockImplementation(() => chain({ data: [], error: null }));
});

describe("claimEntitlement", () => {
  it("flips an unclaimed row and returns it", async () => {
    const row = { id: "e1", status: "claimed", telegram_id: 12345 };
    fromMock.mockReturnValue(chain({ data: row, error: null }));
    const got = await claimEntitlement("e1", 12345);
    expect(got).toEqual(row);
    const c = fromMock.mock.results[0].value;
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ telegram_id: 12345, status: "claimed" }),
    );
    // Only unclaimed rows may flip — a bot retry after a crash can't double-claim.
    expect(c.eq).toHaveBeenCalledWith("id", "e1");
    expect(c.is).toHaveBeenCalledWith("claimed_at", null);
  });

  it("returns null when the row was already claimed", async () => {
    fromMock.mockReturnValue(chain({ data: null, error: null }));
    expect(await claimEntitlement("e1", 12345)).toBeNull();
  });

  it("throws when the database refuses", async () => {
    fromMock.mockReturnValue(chain({ data: null, error: { message: "boom" } }));
    await expect(claimEntitlement("e1", 12345)).rejects.toThrow("boom");
  });
});

describe("findEntitlementByCode", () => {
  it("rejects malformed codes without touching the database", async () => {
    // "not-a-code" would fold to a valid code (O→0), so use genuinely bad input.
    expect(await findEntitlementByCode("!!!")).toEqual([]);
    expect(await findEntitlementByCode("AB")).toEqual([]); // too short
    expect(await findEntitlementByCode(undefined)).toEqual([]);
    expect(await findEntitlementByCode(12345)).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("looks a well-formed code up as an unclaimed paid row", async () => {
    const row = { id: "e2", redeem_code: "EZY-ABCD-1234" };
    fromMock.mockReturnValue(chain({ data: [row], error: null }));
    const got = await findEntitlementByCode("EZY-ABCD-1234");
    expect(got).toEqual([row]);
    const c = fromMock.mock.results[0].value;
    expect(c.eq).toHaveBeenCalledWith("redeem_code", "EZY-ABCD-1234");
    expect(c.eq).toHaveBeenCalledWith("status", "paid");
    expect(c.is).toHaveBeenCalledWith("claimed_at", null);
  });
});

describe("listUnclaimedEntitlements", () => {
  it("returns [] for a handle that normalises to nothing", async () => {
    // The query builder is constructed before the handle check, but the
    // early return means it is never awaited — nothing reaches the database.
    expect(await listUnclaimedEntitlements("@@@")).toEqual([]);
  });

  it("sweeps every handle when no username is given", async () => {
    const row = { id: "e3" };
    fromMock.mockReturnValue(chain({ data: [row], error: null }));
    expect(await listUnclaimedEntitlements()).toEqual([row]);
    const c = fromMock.mock.results[0].value;
    // No ilike filter — this is the every-handle sweep.
    expect(c.ilike).not.toHaveBeenCalled();
    expect(c.eq).toHaveBeenCalledWith("status", "paid");
  });
});

describe("recordEzyAiEntitlement", () => {
  const paidSession = {
    payment_status: "paid",
    livemode: false, // env "test"
    metadata: {
      source: "website",
      sku: "ezyai_pro_1m",
      telegram_username: "@JackTrader",
      redeem_code: "EZY-ABCD-1234",
    },
    customer_details: { email: "jack@example.com" },
    amount_total: 4900,
    currency: "usd",
  };

  it("returns null for an unpaid session, without touching the database", async () => {
    retrieveSession.mockResolvedValue({ ...paidSession, payment_status: "unpaid" });
    expect(await recordEzyAiEntitlement("cs_1", "sandbox")).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns null when metadata is not a website EzyAI purchase", async () => {
    retrieveSession.mockResolvedValue({
      ...paidSession,
      metadata: { source: "telegram", sku: "ezyai_pro_1m" },
    });
    expect(await recordEzyAiEntitlement("cs_1", "sandbox")).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("is idempotent — an existing row for the session is returned, not re-inserted", async () => {
    retrieveSession.mockResolvedValue(paidSession);
    const existing = { id: "e1", stripe_session_id: "cs_1" };
    const c = chain({ data: existing, error: null });
    fromMock.mockReturnValue(c);
    expect(await recordEzyAiEntitlement("cs_1", "sandbox")).toEqual(existing);
    expect(c.insert).not.toHaveBeenCalled();
  });

  it("inserts a fresh entitlement with the metadata redeem code", async () => {
    retrieveSession.mockResolvedValue(paidSession);
    const row = { id: "e5", redeem_code: "EZY-ABCD-1234", status: "paid" };
    fromMock
      .mockReturnValueOnce(chain({ data: null, error: null })) // existing lookup
      .mockReturnValueOnce(chain({ data: row, error: null })); // insert
    expect(await recordEzyAiEntitlement("cs_1", "sandbox")).toEqual(row);
    const insert = fromMock.mock.results[1].value;
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: "cs_1",
        redeem_code: "EZY-ABCD-1234",
        telegram_username: "jacktrader",
        status: "paid",
      }),
    );
  });

  it("recovers from a 23505 race by re-reading the row another writer created", async () => {
    retrieveSession.mockResolvedValue(paidSession);
    const raced = { id: "e9", stripe_session_id: "cs_1" };
    fromMock
      .mockReturnValueOnce(chain({ data: null, error: null })) // existing lookup: nothing yet
      .mockReturnValueOnce(
        chain({ data: null, error: { code: "23505", message: "duplicate key" } }),
      ) // insert loses the race
      .mockReturnValueOnce(chain({ data: raced, error: null })); // re-read finds the winner
    expect(await recordEzyAiEntitlement("cs_1", "sandbox")).toEqual(raced);
    expect(fromMock).toHaveBeenCalledTimes(3);
  });
});
