import { describe, it, expect } from "vitest";
import { buildLlmsTxt, buildSecurityTxt } from "@/lib/geo";
import { SITE_URL } from "@/lib/bot/tiers";
import { EBOOK_PAGES } from "@/lib/ebooks";

describe("buildLlmsTxt()", () => {
  it("lists the key URLs and every ebook, generated from site data", () => {
    const txt = buildLlmsTxt();
    expect(txt).toContain(`${SITE_URL}/home`);
    expect(txt).toContain(`${SITE_URL}/ms`);
    expect(txt).toContain(`${SITE_URL}/indicators`);
    expect(txt).toContain(`${SITE_URL}/macro`);
    expect(txt).toContain(`${SITE_URL}/faq`);
    for (const b of EBOOK_PAGES) expect(txt).toContain(`${SITE_URL}/ebooks/${b.slug}`);
  });
});

describe("buildSecurityTxt()", () => {
  it("has a contact, a canonical URL and an Expires in the future", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const txt = buildSecurityTxt(now);
    expect(txt).toMatch(/^Contact: /m);
    expect(txt).toContain(`Canonical: ${SITE_URL}/.well-known/security.txt`);
    const expires = /^Expires: (.+)$/m.exec(txt)?.[1];
    expect(expires).toBeDefined();
    expect(new Date(expires as string).getTime()).toBeGreaterThan(now.getTime());
  });
});
