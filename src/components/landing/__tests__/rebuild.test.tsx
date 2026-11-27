import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { translations, loadLocale } from "@/lib/translations";
import { LOCALES } from "@/lib/locale-constants";
import { localizePath } from "@/lib/locale-routing";
import { LaunchHero } from "../LaunchHero";
import { FeatureStory } from "../FeatureStory";
import { LinkHub } from "../LinkHub";
import { EzyMapAsset } from "@/components/brand/EzyMapAsset";
import { LINKS } from "@/lib/links";

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
    const doc = new DOMParser().parseFromString(renderToStaticMarkup(<LaunchHero />), "text/html");
    expect(doc.querySelector("h1")?.textContent).toBe("EzyMap ALGO");
    const video = doc.querySelector("video");
    expect(video?.hasAttribute("muted")).toBe(true);
    expect(video?.getAttribute("poster")).toBe("/ezymap-chart-desk.webp");
    expect(video?.querySelector("source")?.getAttribute("src")).toBe("/ezymap-chart-desk.mp4");
    expect(doc.querySelector("figcaption")?.textContent).toContain(
      translations[locale].hero_sample_badge,
    );
    expect(existsSync(`public${video?.querySelector("source")?.getAttribute("src")}`)).toBe(true);
    expect(existsSync(`public${video?.getAttribute("poster")}`)).toBe(true);
    const hrefs = Array.from(doc.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([localizePath("/free-channel", locale), "#packages"]);
    // Localized CTA text is present
    const linkTexts = Array.from(doc.querySelectorAll("a")).map((a) => a.textContent?.trim());
    expect(linkTexts).toContain(translations[locale].hero_cta_join);
    expect(linkTexts).toContain(translations[locale].hero_cta_packages);
    // Poster/fallback image exists on disk
    for (const image of doc.querySelectorAll("img"))
      expect(existsSync(`public${image.getAttribute("src")}`)).toBe(true);
  });

  it("provides a labeled sample diagram and real product destinations", () => {
    state.locale = "en";
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<FeatureStory />),
      "text/html",
    );
    expect(doc.querySelector("#signal-demo")?.textContent).toContain(
      translations.en.hero_disclaimer,
    );
    expect(doc.querySelectorAll("#signal-demo button[aria-pressed]")).toHaveLength(5);
    expect(doc.querySelector("#signal-demo [aria-pressed=true]")?.textContent).toContain("EMA");
    expect(doc.querySelector("#signal-demo")?.textContent).not.toContain("MACD");
    expect(doc.querySelector("#signal-demo")?.textContent).toContain("Trendlines");
    expect(doc.querySelector('#packages a[href="/pricing"]')).not.toBeNull();
    expect(
      doc.querySelector('#packages a[href="/indicators#mt5_drawdown_guardian"]'),
    ).not.toBeNull();
  });

  it("keeps four hub destinations and a non-interactive premium teaser", () => {
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<LinkHub initialMembers={700} />),
      "text/html",
    );
    expect(
      Array.from(doc.querySelectorAll(".hub-content a"), (a) => a.getAttribute("href")),
    ).toEqual(["/home", LINKS.freeClass, LINKS.freeChannel, LINKS.tradingView]);
    const poster = doc.querySelector(".hub-mascot-stage video")?.getAttribute("poster");
    expect(poster).toBe("/assets/3d/mascot-preview.webp");
    expect(doc.querySelector(".hub-mascot-stage source")?.getAttribute("src")).toBe(
      "/assets/3d/mascot-preview.mp4",
    );
    expect(existsSync(`public${poster}`)).toBe(true);
    const teaser = doc.querySelector(".hub-coming-soon");
    expect(teaser?.textContent).toContain("Coming soon");
    expect(teaser?.matches("a, button, [tabindex]")).toBe(false);
    expect(teaser?.querySelector("a, button, [tabindex]")).toBeNull();
    expect(doc.querySelector('.hub-footer a[href="/home"]')).not.toBeNull();
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
