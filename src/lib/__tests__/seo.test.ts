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

  it("claims no translation when twinPath is null (English-only page)", () => {
    const head = localizedHead({ ...base, twinPath: null });
    const alternates = head.links.filter((l) => (l as Record<string, string>).rel === "alternate");
    expect(alternates.map((l) => (l as Record<string, string>).hrefLang)).toEqual([
      "en",
      "x-default",
    ]);
  });

  it("advertises all six locales on a page that has twins", () => {
    const head = localizedHead({ ...base, locale: "ar" });
    const languages = head.links
      .filter((l) => (l as Record<string, string>).rel === "alternate")
      .map((l) => (l as Record<string, string>).hrefLang);
    expect(languages).toEqual(["en", "ms", "zh", "hi", "ar", "sw", "x-default"]);
    expect(head.links.find((l) => (l as Record<string, string>).rel === "canonical")).toMatchObject(
      {
        href: `${SITE_URL}/ar/privacy`,
      },
    );
    const ogLocale = head.meta.find((m) => (m as Record<string, string>).property === "og:locale");
    expect(ogLocale?.content).toBe("ar_SA");
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
