import { describe, expect, it } from "vitest";
import { mergeInbound } from "../support-poll";

const row = (id: number, author = "Sarah", role = "sarah") => ({ id, role, author, text: `m${id}` });

describe("mergeInbound", () => {
  it("appends new Sarah replies", () => {
    const out = mergeInbound([{ id: -1 }], [row(5)]);
    expect(out.map((m) => m.id)).toEqual([-1, 5]);
  });

  it("skips ids already on screen (overlapping polls)", () => {
    const out = mergeInbound([{ id: 5 }], [row(5), row(6)]);
    expect(out.map((m) => m.id)).toEqual([5, 6]);
  });

  it("ignores visitor rows and non-Sarah authors", () => {
    const out = mergeInbound([], [row(1, "You", "visitor"), row(2, "Bot", "sarah")]);
    expect(out).toEqual([]);
  });
});
