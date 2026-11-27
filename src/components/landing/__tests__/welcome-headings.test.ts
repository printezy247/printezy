import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync("src/components/landing/LinkHub.tsx", "utf8");

describe("LinkHub.tsx heading order", () => {
  it("starts with one page h1", () => {
    expect(src.match(/<h1\b/g)).toHaveLength(1);
    expect(src.match(/<h[1-6]\b/)?.[0]).toBe("<h1");
  });
});
