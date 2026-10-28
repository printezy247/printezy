import { describe, it, expect, vi, beforeEach } from "vitest";

const fromMock = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => fromMock(...args) },
}));

const listSessions = vi.fn();
const retrieveSession = vi.fn();
vi.mock("@/lib/stripe.server", () => ({
  createStripeClient: () => ({
    checkout: {
      sessions: {
        list: (...args: unknown[]) => listSessions(...args),
        retrieve: (id: string) => retrieveSession(id),
      },
    },
  }),
  detectStripeEnv: () => "sandbox",
}));

vi.mock("@/lib/bot/purchases.server", () => ({
  recordSitePurchase: vi.fn(async () => true),
}));
vi.mock("@/lib/ezyai/entitlements.server", () => ({
  recordEzyAiEntitlement: vi.fn(async () => ({})),
}));
vi.mock("@/lib/bot/site-access.server", () => ({
  grantRecordedPurchase: vi.fn(async () => true),
}));
vi.mock("@/lib/bot/enrollment.server", () => ({
  activatePaidEnrollment: vi.fn(async () => true),
}));

import { scanUnfulfilledSessions } from "../reconciliation.server";
import { fulfillSession } from "../fulfillment.server";
import { recordSitePurchase } from "../purchases.server";
import { recordEzyAiEntitlement } from "@/lib/ezyai/entitlements.server";
import { grantRecordedPurchase } from "../site-access.server";
import { activatePaidEnrollment } from "../enrollment.server";

type Result = { data: unknown; error: unknown };

function chain(result: Result) {
  const c: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "eq", "in", "order", "limit"]) {
    c[m] = vi.fn(() => c);
  }
  c.maybeSingle = vi.fn(async () => result);
  c.then = (onFulfilled: unknown, onRejected: unknown) =>
    Promise.resolve(result).then(onFulfilled as never, onRejected as never);
  return c;
}

const session = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  payment_status: "paid",
  livemode: false,
  metadata: { source: "website", sku: "mapping-like-a-pro" },
  amount_total: 2900,
  currency: "usd",
  created: 1_700_000_000,
  ...extra,
});

beforeEach(() => {
  fromMock.mockReset();
  listSessions.mockReset();
  retrieveSession.mockReset();
  vi.mocked(recordSitePurchase).mockReset().mockResolvedValue(true);
});

describe("scanUnfulfilledSessions", () => {
  it("reports paid website sessions with no purchase row", async () => {
    listSessions.mockResolvedValue({ data: [session("cs_1"), session("cs_2")] });
    fromMock.mockReturnValue(chain({ data: [{ stripe_session_id: "cs_1" }], error: null }));
    const { scanned, missing } = await scanUnfulfilledSessions("sandbox", {});
    expect(scanned).toBe(2);
    expect(missing.map((m) => m.sessionId)).toEqual(["cs_2"]);
  });

  it("ignores unpaid, wrong-env, and non-website sessions", async () => {
    listSessions.mockResolvedValue({
      data: [
        session("cs_unpaid", { payment_status: "unpaid" }),
        session("cs_live", { livemode: true }),
        session("cs_bot", { metadata: { source: "telegram" } }),
      ],
    });
    const { scanned, missing } = await scanUnfulfilledSessions("sandbox", {});
    expect(scanned).toBe(0);
    expect(missing).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("fulfillSession", () => {
  it("routes catalog purchases through record + site grant", async () => {
    await fulfillSession("cs_1", { source: "website", sku: "mapping-like-a-pro" }, "sandbox");
    expect(recordSitePurchase).toHaveBeenCalledWith("cs_1", "sandbox");
    expect(grantRecordedPurchase).toHaveBeenCalledWith("cs_1");
    expect(recordEzyAiEntitlement).not.toHaveBeenCalled();
  });

  it("routes EzyAI purchases through the entitlement bridge instead", async () => {
    await fulfillSession("cs_2", { source: "website", sku: "ezyai_pro_1m" }, "sandbox");
    expect(recordEzyAiEntitlement).toHaveBeenCalledWith("cs_2", "sandbox");
    expect(grantRecordedPurchase).not.toHaveBeenCalled();
  });

  it("routes bot checkouts to enrollment activation", async () => {
    await fulfillSession("cs_3", { source: "telegram" }, "sandbox");
    expect(recordSitePurchase).not.toHaveBeenCalled();
    expect(activatePaidEnrollment).toHaveBeenCalledWith("cs_3");
  });
});
