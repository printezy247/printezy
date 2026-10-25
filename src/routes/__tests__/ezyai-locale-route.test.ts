import { describe, it, expect, vi } from "vitest";
import { existsSync } from "node:fs";
import { SITE_URL } from "@/lib/bot/tiers";

/**
 * P2.5: the EzyAI page has one route for `/ezyai` and one wildcard route for
 * every translated URL (`/ms/ezyai` today). Both have to keep their own head
 * metadata, and the hidden-board redirect has to stay in the visitor's
 * language — a Malay visitor must not be thrown onto the English home page.
 */

type RouteLike = {
  options: {
    head?: (ctx: unknown) => {
      meta: Array<Record<string, string>>;
      links: Array<Record<string, string>>;
    };
    beforeLoad?: (ctx: unknown) => unknown;
  };
};

/** Load both routes with the board switch in a known state. */
async function loadRoutes(boardVisible: boolean) {
  vi.resetModules();
  vi.doMock("@/lib/ezyai/visibility", () => ({ EZYAI_BOARD_VISIBLE: boardVisible }));
  const [localized, english] = await Promise.all([import("../$lang/ezyai"), import("../ezyai")]);
  return {
    localized: localized.Route as unknown as RouteLike,
    english: english.Route as unknown as RouteLike,
  };
}

const runHead = (route: RouteLike, params: Record<string, string> = {}) =>
  route.options.head!({ params, loaderData: undefined, search: {} });

const runBeforeLoad = (route: RouteLike, params: Record<string, string> = {}) =>
  route.options.beforeLoad!({ params, search: {}, location: { href: "/" }, context: {} });

const metaContent = (head: ReturnType<typeof runHead>, name: string) =>
  head.meta.find((tag) => tag.name === name || tag.property === name)?.content;

const titleOf = (head: ReturnType<typeof runHead>) => head.meta.find((tag) => tag.title)?.title;

const link = (head: ReturnType<typeof runHead>, rel: string, hrefLang?: string) =>
  head.links.find((l) => l.rel === rel && (hrefLang === undefined || l.hrefLang === hrefLang))
    ?.href;

describe("the per-locale EzyAI routes", () => {
  it("are one wildcard route, not a copy per locale", () => {
    expect(existsSync("src/routes/ms/ezyai.tsx")).toBe(false);
    expect(existsSync("src/routes/$lang/ezyai.tsx")).toBe(true);
  });
});

describe("English EzyAI route (/ezyai)", () => {
  it("is self-canonical with reciprocal hreflang", async () => {
    const { english } = await loadRoutes(true);
    const head = runHead(english);

    expect(titleOf(head)).toBe("EzyAI — AI Trading Signals on Telegram | EzyMap Algo");
    expect(link(head, "canonical")).toBe(`${SITE_URL}/ezyai`);
    expect(link(head, "alternate", "ms")).toBe(`${SITE_URL}/ms/ezyai`);
    expect(link(head, "alternate", "x-default")).toBe(`${SITE_URL}/ezyai`);
  });
});

describe("localized EzyAI route (/ms/ezyai)", () => {
  it("serves the Malay head, canonically at /ms/ezyai", async () => {
    const { localized } = await loadRoutes(true);
    const head = runHead(localized, { lang: "ms" });

    expect(titleOf(head)).toBe("EzyAI — Isyarat Dagangan AI di Telegram | EzyMap Algo");
    expect(metaContent(head, "og:locale")).toBe("ms_MY");
    expect(link(head, "canonical")).toBe(`${SITE_URL}/ms/ezyai`);
    expect(link(head, "alternate", "en")).toBe(`${SITE_URL}/ezyai`);
    expect(link(head, "alternate", "ms")).toBe(`${SITE_URL}/ms/ezyai`);
  });

  it("404s a locale that has no translated page", async () => {
    const { localized } = await loadRoutes(true);
    let thrown: unknown;
    try {
      runBeforeLoad(localized, { lang: "fr" });
    } catch (error) {
      thrown = error;
    }
    expect((thrown as { isNotFound?: boolean } | undefined)?.isNotFound).toBe(true);
  });

  it("leaves a valid locale alone while the board is visible", async () => {
    const { localized, english } = await loadRoutes(true);
    expect(runBeforeLoad(localized, { lang: "ms" })).toBeUndefined();
    expect(runBeforeLoad(english)).toBeUndefined();
  });
});

describe("hidden board redirects stay in the visitor's language", () => {
  it("sends /ms/ezyai to /ms, not to the English home page", async () => {
    const { localized } = await loadRoutes(false);
    expect(() => runBeforeLoad(localized, { lang: "ms" })).toThrowError(
      expect.objectContaining({ options: expect.objectContaining({ to: "/ms" }) }),
    );
  });

  it("sends /ezyai to /", async () => {
    const { english } = await loadRoutes(false);
    expect(() => runBeforeLoad(english)).toThrowError(
      expect.objectContaining({ options: expect.objectContaining({ to: "/" }) }),
    );
  });
});
