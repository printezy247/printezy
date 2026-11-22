import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { translations, loadLocale } from "@/lib/translations";
import { LOCALES } from "@/lib/locale-constants";
import { localizePath } from "@/lib/locale-routing";
import { LaunchHero } from "../LaunchHero";
import { ProductDiscovery } from "../ProductDiscovery";
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
  it.each(LOCALES)("keeps localized copy and destinations for %s", async (locale) => {
    await loadLocale(locale);
    state.locale = locale;
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(
        <>
          <LaunchHero />
          <ProductDiscovery />
        </>,
      ),
      "text/html",
    );
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.querySelector("h1")?.textContent).toBe(translations[locale].hero_title);
    const hrefs = Array.from(doc.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain(localizePath("/free-channel", locale));
    expect(hrefs).toContain(localizePath("/ebooks/technical-analysis", locale));
    expect(hrefs).toContain(localizePath("/macro", locale));
    expect(hrefs).toContain("#packages");
    expect(hrefs).toContain("#signal-demo");
    for (const image of doc.querySelectorAll("img"))
      expect(existsSync(`public${image.getAttribute("src")}`)).toBe(true);
  });

  it("lets the visitor stop and restart hero animation", async () => {
    state.locale = "en";
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(<LaunchHero />));
    expect(container.querySelector(".launch-gem img")?.getAttribute("src")).toContain(
      "hero-fintech",
    );
    await act(async () =>
      (container.querySelector('[aria-label="Pause animation"]') as HTMLButtonElement).click(),
    );
    expect(container.querySelector(".launch-gem img")?.getAttribute("src")).toContain("3d-mark");
    await act(async () =>
      (container.querySelector('[aria-label="Play animation"]') as HTMLButtonElement).click(),
    );
    expect(container.querySelector(".launch-gem img")?.getAttribute("src")).toContain(
      "hero-fintech",
    );
    await act(async () => root.unmount());
    container.remove();
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
