import { describe, it, expect } from "vitest";
import { buildSitemap } from "@/routes/sitemap[.]xml";
import { SITE_URL } from "@/lib/bot/tiers";

describe("buildSitemap()", () => {
  const xml = buildSitemap();
  const urlBlock = (path: string) => {
    const at = xml.indexOf(`<loc>${SITE_URL}${path}</loc>`);
    expect(at).toBeGreaterThan(-1);
    return xml.slice(xml.lastIndexOf("<url>", at), xml.indexOf("</url>", at));
  };

  it("gives /ms its own canonical loc", () => {
    expect(urlBlock("/ms")).toContain(`<loc>${SITE_URL}/ms</loc>`);
  });

  it("emits no alternates for / (it has no Malay twin)", () => {
    expect(urlBlock("/")).not.toContain("xhtml:link");
  });

  it("links /home and /ms as twins", () => {
    const home = urlBlock("/home");
    expect(home).toContain(`hreflang="en" href="${SITE_URL}/home"`);
    expect(home).toContain(`hreflang="ms" href="${SITE_URL}/ms"`);
    expect(home).toContain(`hreflang="x-default" href="${SITE_URL}/home"`);
  });

  it("includes the generated GEO files as plain URLs", () => {
    expect(xml).toContain(`<loc>${SITE_URL}/llms.txt</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/.well-known/security.txt</loc>`);
  });
});
