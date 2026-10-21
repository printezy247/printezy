import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The audit flagged that the source lists a section <h2> before the page <h1>.
 * The DOM already renders the h1 first, but keeping the source order aligned
 * stops the next scan (and the next author) from moving it back.
 */
const src = readFileSync("src/components/landing/Welcome.tsx", "utf8");

describe("Welcome.tsx heading order", () => {
  it("lists the page h1 before any h2 in source order", () => {
    expect(src.indexOf("<h1")).toBeGreaterThan(-1);
    expect(src.indexOf("<h2")).toBeGreaterThan(-1);
    expect(src.indexOf("<h1")).toBeLessThan(src.indexOf("<h2"));
  });
});
