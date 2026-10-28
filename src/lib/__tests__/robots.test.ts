import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const robots = readFileSync("public/robots.txt", "utf8");

describe("robots.txt", () => {
  it("blocks the real private page URLs in every group", () => {
    const groups = robots.split(/\n\s*\n/).filter((g) => g.includes("User-agent"));
    expect(groups.length).toBeGreaterThan(1);
    for (const g of groups) {
      expect(g).toContain("Disallow: /ads-dashboard");
      expect(g).toContain("Disallow: /site-analytics");
    }
  });

  it("does not list the pathless layout name /_authenticated/", () => {
    expect(robots).not.toContain("/_authenticated/");
  });
});
