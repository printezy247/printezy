import { describe, it, expect, vi, beforeEach } from "vitest";

const fromMock = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => fromMock(...args) },
}));

import { pushSignal } from "../signals.server";

type Result = { data: unknown; error: unknown };

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

beforeEach(() => {
  fromMock.mockReset();
  fromMock.mockImplementation(() => chain({ data: [], error: null }));
});

const closed = { id: "s1", status: "tp" };

describe("sealed outcomes", () => {
  it("refuses to reopen a closed signal", async () => {
    fromMock.mockReturnValueOnce(chain({ data: closed, error: null }));
    const res = await pushSignal({ external_id: "x1", status: "sl" });
    expect(res.ok).toBe(false);
    expect((res as { error: string }).error).toMatch(/sealed/);
    const c = fromMock.mock.results[0].value;
    expect(c.update).not.toHaveBeenCalled();
  });

  it("ignores outcome changes on a re-pushed close, keeping the sealed row", async () => {
    fromMock.mockReturnValueOnce(chain({ data: closed, error: null }));
    const res = await pushSignal({ external_id: "x1", status: "tp", result_r: 9.9 });
    expect(res).toEqual({ ok: true, id: "s1", created: false });
    const update = fromMock.mock.results[1].value.update as ReturnType<typeof vi.fn>;
    const patch = update.mock.calls[0][0] as Record<string, unknown>;
    expect(patch).not.toHaveProperty("result_r");
    expect(patch).not.toHaveProperty("status");
  });

  it("still merges a bare note tick on a closed signal", async () => {
    fromMock.mockReturnValueOnce(chain({ data: closed, error: null }));
    const res = await pushSignal({ external_id: "x1", note: "late context" });
    expect(res).toEqual({ ok: true, id: "s1", created: false });
    const update = fromMock.mock.results[1].value.update as ReturnType<typeof vi.fn>;
    expect(update.mock.calls[0][0]).toMatchObject({ note: "late context" });
  });
});
