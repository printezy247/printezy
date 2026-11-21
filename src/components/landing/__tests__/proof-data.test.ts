import { describe, expect, it } from "vitest";
import { PROOFS } from "../proof-data";

const names = PROOFS.map((p) => p.name);

describe("proof wall data", () => {
  it("has two Telegram chats", () => {
    expect(PROOFS).toHaveLength(2);
    for (const p of PROOFS) expect(p.kind).toBe("telegram");
  });

  it("shows every member as 'EzyMap | <name>', never a real full name", () => {
    for (const n of names) expect(n).toMatch(/^EzyMap \| \S/);
    expect(names.join(" ")).not.toMatch(/broski/i);
  });

  it("gives every message an English translation", () => {
    for (const p of PROOFS) {
      for (const t of p.messages) expect(t.en.length).toBeGreaterThan(0);
    }
  });

  it("states where each card came from", () => {
    for (const p of PROOFS) expect(p.source.length).toBeGreaterThan(10);
  });
});
