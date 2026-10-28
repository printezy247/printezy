import { describe, expect, it } from "vitest";
import {
  localizePath,
  localeFromPath,
  pageLocaleParam,
  routeLocaleFor,
  stripLocale,
  switchedPath,
} from "@/lib/locale-routing";
import { LOCALES } from "@/lib/locale-constants";

const prefixed = LOCALES.filter((locale) => locale !== "en");

describe("locale routing helpers", () => {
  it("parses only supported locale prefixes", () => {
    expect(localeFromPath("/ar/faq")).toBe("ar");
    expect(localeFromPath("/fr/faq")).toBeUndefined();
    expect(pageLocaleParam("ms")).toBe("ms");
    expect(pageLocaleParam("en")).toBeUndefined();
  });

  it("adds and removes locale prefixes while preserving fragments", () => {
    expect(localizePath("/faq", "en")).toBe("/faq");
    for (const locale of prefixed) {
      expect(localizePath("/faq#contact", locale)).toBe(`/${locale}/faq#contact`);
      expect(stripLocale(`/${locale}/faq`)).toBe("/faq");
    }
    expect(localizePath("/home", "zh")).toBe("/zh");
  });

  it("switches supported localized routes and leaves private routes alone", () => {
    expect(routeLocaleFor("/faq")).toBe("en");
    expect(routeLocaleFor("/dashboard")).toBeUndefined();
    expect(switchedPath("/faq", "ar")).toBe("/ar/faq");
    expect(switchedPath("/ar/faq", "en")).toBe("/faq");
    expect(switchedPath("/zh", "en")).toBe("/home");
    expect(switchedPath("/dashboard", "ar")).toBeUndefined();
  });
});
