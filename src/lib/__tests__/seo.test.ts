import { describe, it, expect } from "vitest";
import { OG_IMAGES, buildBreadcrumbJsonLd, localizedHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/bot/tiers";

describe("localizedHead()", () => {
  const base = {
    path: "/privacy",
    locale: "en" as const,
    title: "Privacy Policy — EzyMap ALGO",
    description: "Read how EzyMap ALGO handles your data.",
  };

  it("declares true og:image dimensions matching the real image file", () => {
    const head = localizedHead(base);
    const ogWidth = head.meta.find(
      (m) => (m as Record<string, string>).property === "og:image:width",
    );
    const ogHeight = head.meta.find(
      (m) => (m as Record<string, string>).property === "og:image:height",
    );
    expect(ogWidth?.content).toBe("1200");
    expect(ogHeight?.content).toBe("630");
  });

  it("defaults twitter:description to the page description when not passed", () => {
    const head = localizedHead(base);
    const twitterDesc = head.meta.find(
      (m) => (m as Record<string, string>).name === "twitter:description",
    );
    expect(twitterDesc?.content).toBe(base.description);
  });

  it("emits theme-color meta", () => {
    const head = localizedHead(base);
    const themeColor = head.meta.find((m) => (m as Record<string, string>).name === "theme-color");
    expect(themeColor).toBeDefined();
  });

  it("emits og:site_name", () => {
    const head = localizedHead(base);
    const siteName = head.meta.find(
      (m) => (m as Record<string, string>).property === "og:site_name",
    );
    expect(siteName?.content).toBe("EzyMap ALGO");
  });

  it("does not emit an ms hreflang when msPath is null (page has no Malay twin)", () => {
    const head = localizedHead({ ...base, msPath: null });
    const msLinks = head.links.filter((l) => (l as Record<string, string>).hrefLang === "ms");
    expect(msLinks).toHaveLength(0);
  });

  it("uses the registry slug's real dimensions and URL", () => {
    const head = localizedHead({ ...base, image: "welcome" });
    const ogImage = head.meta.find((m) => (m as Record<string, string>).property === "og:image");
    const ogWidth = head.meta.find(
      (m) => (m as Record<string, string>).property === "og:image:width",
    );
    expect(ogImage?.content).toBe(`${SITE_URL}${OG_IMAGES.welcome.image}`);
    expect(ogWidth?.content).toBe(String(OG_IMAGES.welcome.width));
  });

  it("keeps 1200x630 for a deprecated full-path image", () => {
    const head = localizedHead({ ...base, image: "/ezymap-logo.png" });
    const ogImage = head.meta.find((m) => (m as Record<string, string>).property === "og:image");
    expect(ogImage?.content).toBe(`${SITE_URL}/ezymap-logo.png`);
  });
});

describe("OG_IMAGES registry", () => {
  it("declares the default card as a real 1200x630 PNG", () => {
    expect(OG_IMAGES.default.width).toBe(1200);
    expect(OG_IMAGES.default.height).toBe(630);
    expect(OG_IMAGES.default.image).toBe("/og-default.png");
  });
});

describe("buildBreadcrumbJsonLd()", () => {
  it("returns a BreadcrumbList with the explicit crumb name", () => {
    const json = JSON.parse(
      buildBreadcrumbJsonLd({
        path: "/privacy",
        locale: "en",
        title: "Privacy Policy — EzyMap ALGO",
        description: "d",
        crumbName: "Privacy",
      }),
    );
    expect(json["@type"]).toBe("BreadcrumbList");
    expect(json.itemListElement[1].name).toBe("Privacy");
    expect(json.itemListElement[1].item).toBe(`${SITE_URL}/privacy`);
  });
});
