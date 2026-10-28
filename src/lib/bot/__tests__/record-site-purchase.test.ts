import { describe, it, expect, vi, beforeEach } from "vitest";

// Same harness as the entitlements tests: the server module builds the
// Supabase admin client at import time, so mock the client module first.
const fromMock = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
    auth: { admin: { createUser: vi.fn(), listUsers: vi.fn() } },
  },
}));

const retrieveSession = vi.fn();
vi.mock("@/lib/stripe.server", () => ({
  createStripeClient: () => ({
    checkout: { sessions: { retrieve: (id: string) => retrieveSession(id) } },
  }),
}));

// Harness must not message Telegram or resolve Sarah in tests.
vi.mock("@/lib/bot/telegram.server", () => ({
  escapeHtml: (s: string) => s,
  sendMessage: vi.fn(async () => {}),
}));
vi.mock("@/lib/bot/sarah.server", () => ({
  getSarahChatId: vi.fn(async () => null),
}));

import { recordSitePurchase } from "../purchases.server";

type Result = { data: unknown; error: unknown };

/** Chainable query builder mirroring the entitlements-test harness. */
function chain(result: Result) {
  const c: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "eq", "order", "limit"]) {
    c[m] = vi.fn(() => c);
  }
  c.maybeSingle = vi.fn(async () => result);
  c.then = (onFulfilled: unknown, onRejected: unknown) =>
    Promise.resolve(result).then(onFulfilled as never, onRejected as never);
  return c;
}

const paidSession = {
  payment_status: "paid",
  livemode: false, // env "sandbox"
  metadata: { source: "website", sku: "mapping-like-a-pro" },
  customer_details: null,
  customer_email: null,
  amount_total: 2900,
  currency: "usd",
};

beforeEach(() => {
  fromMock.mockReset();
  retrieveSession.mockReset();
  retrieveSession.mockResolvedValue(paidSession);
  fromMock.mockImplementation(() => chain({ data: [], error: null }));
});

describe("recordSitePurchase", () => {
  it("returns true without inserting when the session is already recorded", async () => {
    const c = chain({ data: { id: "p1" }, error: null });
    fromMock.mockReturnValue(c);
    expect(await recordSitePurchase("cs_1", "sandbox")).toBe(true);
    expect(c.insert).not.toHaveBeenCalled();
  });

  it("treats a 23505 insert race as already-recorded instead of throwing", async () => {
    fromMock
      .mockReturnValueOnce(chain({ data: null, error: null })) // existing lookup: nothing yet
      .mockReturnValueOnce(
        chain({ data: null, error: { code: "23505", message: "duplicate key" } }),
      ); // insert loses the race
    // Must not throw (a throw becomes a webhook 400 and a pointless Stripe
    // retry); the winner already notified Sarah.
    expect(await recordSitePurchase("cs_1", "sandbox")).toBe(true);
  });

  it("still throws on a genuine insert failure", async () => {
    fromMock
      .mockReturnValueOnce(chain({ data: null, error: null }))
      .mockReturnValueOnce(chain({ data: null, error: { message: "db down" } }));
    await expect(recordSitePurchase("cs_1", "sandbox")).rejects.toThrow("db down");
  });

  it("ignores unpaid sessions without touching the database", async () => {
    retrieveSession.mockResolvedValue({ ...paidSession, payment_status: "unpaid" });
    expect(await recordSitePurchase("cs_1", "sandbox")).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
