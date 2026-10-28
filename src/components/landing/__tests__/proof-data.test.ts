import { describe, expect, it } from "vitest";
import { PROOFS } from "../proof-data";

const names = PROOFS.flatMap((p) =>
  p.kind === "tiktok" ? p.comments.map((c) => c.name) : [p.name],
);

describe("proof wall data", () => {
  it("has two Telegram chats and one TikTok live with three comments", () => {
    expect(PROOFS.filter((p) => p.kind === "telegram")).toHaveLength(2);
    const tiktok = PROOFS.filter((p) => p.kind === "tiktok");
    expect(tiktok).toHaveLength(1);
    expect(tiktok[0].kind === "tiktok" && tiktok[0].comments).toHaveLength(3);
  });

  it("shows every member as 'EzyMap | <name>', never a real full name", () => {
    for (const n of names) expect(n).toMatch(/^EzyMap \| \S/);
    expect(names.join(" ")).not.toMatch(/broski/i);
  });

  it("gives every message and comment an English translation", () => {
    for (const p of PROOFS) {
      const texts = p.kind === "tiktok" ? p.comments : p.messages;
      for (const t of texts) expect(t.en.length).toBeGreaterThan(0);
    }
  });

  it("states where each card came from", () => {
    for (const p of PROOFS) expect(p.source.length).toBeGreaterThan(10);
  });
});
