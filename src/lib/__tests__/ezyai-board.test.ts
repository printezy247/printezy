import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { EZYAI_BOARD_VISIBLE } from "../ezyai/visibility";
import { translations } from "../translations";

/**
 * The board is a mirror now: the bot pushes every live signal (autopilot and
 * watch alike) and the site only stores, serves and shows what it is told.
 * The old self-running scanner (Yahoo feeds, indicators, its own autopilot)
 * is gone for good, and these tests pin that shape down so it cannot creep
 * back in a refactor.
 */

const read = (path: string) => readFileSync(path, "utf8");

describe("the board is visible", () => {
  it("runs on one flag, and that flag is on", () => {
    expect(EZYAI_BOARD_VISIBLE).toBe(true);
  });

  it("lists /ezyai in the sitemap, gated on the same flag", () => {
    const src = read("src/routes/sitemap[.]xml.ts");
    expect(src).toContain('path: "/ezyai"');
    expect(src).toContain("EZYAI_BOARD_VISIBLE");
  });
});

describe("the site-side scanner is removed", () => {
  it("has no scanner modules left", () => {
    for (const f of [
      "src/lib/ezyai/autopilot.ts",
      "src/lib/ezyai/autopilot.server.ts",
      "src/lib/ezyai/market.server.ts",
      "src/lib/ezyai/indicators.ts",
      "src/routes/api/public/ezyai/autopilot.ts",
    ]) {
      expect(existsSync(f), f).toBe(false);
    }
  });

  it("never runs code when the board loads — reading only", () => {
    expect(read("src/lib/ezyai/signals.functions.ts")).not.toMatch(/runAutopilot/);
  });
});

describe("the signal bridge keeps its key check honest", () => {
  it("answers diagnose only to callers carrying the key", () => {
    const src = read("src/routes/api/public/ezyai/signals.ts");
    const getHandler = src.slice(src.indexOf("GET: async"));
    expect(getHandler.indexOf("guard(request")).toBeGreaterThan(-1);
    expect(getHandler.indexOf("guard(request")).toBeLessThan(getHandler.indexOf("diagnose"));
  });
});

describe("the board page is keyboard- and screen-reader-shaped", () => {
  const src = read("src/routes/ezyai.tsx");

  it("uses a real tablist, not pressed buttons", () => {
    expect(src).toContain('role="tablist"');
    expect(src).toContain('role="tab"');
    expect(src).toContain("aria-selected");
    expect(src).toContain("ArrowRight");
  });

  it("tells assistive tech when the board is loading", () => {
    expect(src).toContain('role="status"');
  });

  it("respects prefers-reduced-motion on the cards", () => {
    expect(read("src/components/ezyai/SignalCard.tsx")).toContain("usePrefersReducedMotion");
  });
});

describe("copy matches what actually runs", () => {
  const locales = Object.keys(translations) as (keyof typeof translations)[];

  it("advertises no scalp style anywhere — it is retired", () => {
    for (const locale of locales) {
      const strings = translations[locale];
      for (const key of ["hero_stat_styles", "faq_g1_a2", "faq_g1_a3"] as const) {
        expect(`${locale}.${key}: ${strings[key]}`).not.toMatch(/scalp/i);
      }
    }
  });

  it("leaves the English word 'signal(s)' out of non-English titles", () => {
    for (const locale of locales) {
      if (locale === "en") continue;
      expect(`${locale}: ${translations[locale].ezyai_page_title}`).not.toMatch(/signals/i);
    }
  });

  it("says the board carries the bot's live signals, not just the autopilot's", () => {
    expect(translations.en.ezyai_sig_desc).toMatch(/watch/i);
    expect(translations.en.ezyai_sig_empty).not.toMatch(/autopilot/i);
  });
});
