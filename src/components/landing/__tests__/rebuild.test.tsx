import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { translations, loadLocale } from "@/lib/translations";
import { LOCALES } from "@/lib/locale-constants";
import { localizePath } from "@/lib/locale-routing";
import { LaunchHero } from "../LaunchHero";
import { EzyMapAsset } from "@/components/brand/EzyMapAsset";

const state = vi.hoisted(() => ({ locale: "en" as import("@/lib/locale-constants").Locale }));
vi.mock("@/lib/analytics", () => ({ goTrack: vi.fn() }));
vi.mock("@/lib/i18n", async () => {
  const copy = await import("@/lib/translations");
  const routing = await import("@/lib/locale-routing");
  return {
    localizePath: routing.localizePath,
    useTranslation: () => ({
      locale: state.locale,
      t: (key: import("@/lib/translations").TranslationKey) => copy.translations[state.locale][key],
    }),
  };
});

describe("rebuilt marketing journeys", () => {
  it.each(LOCALES)("keeps localized hero CTAs and destinations for %s", async (locale) => {
    await loadLocale(locale);
    state.locale = locale;
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<LaunchHero />),
      "text/html",
    );
    // The 3D hero is visual-first: no h1, CTAs carry the localized copy.
    const hrefs = Array.from(doc.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain(localizePath("/free-channel", locale));
    expect(hrefs).toContain(localizePath("/ebooks/technical-analysis", locale));
    expect(hrefs).toContain("#packages");
    // Localized CTA text is present
    const linkTexts = Array.from(doc.querySelectorAll("a")).map((a) => a.textContent?.trim());
    expect(linkTexts).toContain(translations[locale].hero_cta_join);
    expect(linkTexts).toContain(translations[locale].hero_cta_packages);
    expect(linkTexts).toContain(translations[locale].hero_cta_ebook);
    // Poster/fallback image exists on disk
    for (const image of doc.querySelectorAll("img"))
      expect(existsSync(`public${image.getAttribute("src")}`)).toBe(true);
  });

  it("mounts 12 market symbols and 18 trader-problem glyphs", () => {
    state.locale = "en";
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<LaunchHero />),
      "text/html",
    );
    expect(doc.querySelectorAll(".pointer-glyph")).toHaveLength(38);
    expect(doc.querySelectorAll(".pointer-glyph--text")).toHaveLength(26);
  });

  it("ships upstream artwork with reduced-motion fallbacks", () => {
    const manifest = JSON.parse(readFileSync("public/brand/ezymap/provenance.json", "utf8"));
    for (const path of manifest.files as string[]) {
      const svg = readFileSync(`public/brand/ezymap/${path}`, "utf8");
      expect(svg).toContain("<svg");
      if (svg.includes("@keyframes")) expect(svg).toContain("prefers-reduced-motion");
    }
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<EzyMapAsset product="channel" animated />),
      "text/html",
    );
    expect(existsSync(`public${doc.querySelector("img")?.getAttribute("src")}`)).toBe(true);
  });
});
