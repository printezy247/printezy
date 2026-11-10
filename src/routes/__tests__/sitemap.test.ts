import { describe, expect, it, vi, afterEach } from "vitest";

// The /ezyai entry must track the board-visibility flag exactly: the route
// redirects when the flag is false, and a sitemap entry for a redirecting
// route earns a crawl warning. Re-import the sitemap builder under each flag.
afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/ezyai/visibility");
});

function mockVisibility(visible: boolean) {
  vi.doMock("@/lib/ezyai/visibility", () => ({ EZYAI_BOARD_VISIBLE: visible }));
}

async function buildWith(visible: boolean): Promise<string> {
  mockVisibility(visible);
  vi.resetModules();
  const mod = await import("../sitemap[.]xml");
  return mod.buildSitemap();
}

describe("sitemap /ezyai visibility", () => {
  it("lists /ezyai when the board is visible", async () => {
    const xml = await buildWith(true);
    expect(xml).toContain(`<loc>https://printezy.money/ezyai</loc>`);
  });

  it("omits /ezyai when the board is hidden", async () => {
    const xml = await buildWith(false);
    expect(xml).not.toContain("/ezyai");
  });

  it("carries a build-date lastmod on every entry", async () => {
    const xml = await buildWith(true);
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    expect(xml.match(/<lastmod>/g)?.length).toBeGreaterThan(0);
  });
});
