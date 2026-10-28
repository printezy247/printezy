import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `/robots.txt` is served from `public/` — the `src/routes/robots[.]txt.ts`
 * handler was deleted because the static file shadows it and the two had
 * already drifted. This pins the static file as the live contract: crawlers
 * allowed, private paths disallowed, sitemap named.
 */
// process.cwd(): vitest runs from the project root, and `new URL(…,
// import.meta.url)` mis-resolves under the jsdom environment, so anchor on
// the working directory instead.
const BODY = readFileSync(join(process.cwd(), "public/robots.txt"), "utf8");

describe("public/robots.txt", () => {
  it("allows crawling and names the sitemap", () => {
    expect(BODY).toContain("User-agent: *");
    expect(BODY).toContain("Allow: /");
    expect(BODY).toContain("Sitemap: https://printezy.money/sitemap.xml");
  });

  it("keeps private and fulfillment paths out of the index", () => {
    for (const path of ["/account", "/dashboard", "/auth", "/checkout-success"]) {
      expect(BODY).toContain(`Disallow: ${path}`);
    }
  });
});
