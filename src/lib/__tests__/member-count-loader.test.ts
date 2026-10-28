import { describe, expect, it } from "vitest";
import { loadMemberCount } from "../member-count-loader";

describe("loadMemberCount", () => {
  it("returns the live count", async () => {
    expect(await loadMemberCount(async () => 812, 50, 640)).toBe(812);
  });

  it("falls back when the fetch throws", async () => {
    const boom = async () => {
      throw new Error("db down");
    };
    expect(await loadMemberCount(boom, 50, 640)).toBe(640);
  });

  it("falls back when the fetch is slower than the timeout", async () => {
    const slow = () => new Promise<number>((r) => setTimeout(() => r(999), 200));
    expect(await loadMemberCount(slow, 20, 640)).toBe(640);
  });

  it("falls back on a nonsense value", async () => {
    expect(await loadMemberCount(async () => Number.NaN, 50, 640)).toBe(640);
    expect(await loadMemberCount(async () => 0, 50, 640)).toBe(640);
  });
});
