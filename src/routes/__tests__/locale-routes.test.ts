import { describe, it, expect } from "vitest";
import { SITE_URL } from "@/lib/bot/tiers";
import { localizePath, routeLocaleFor, stripLocale, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import { buildSitemap } from "@/routes/sitemap[.]xml";

/**
 * The six-locale surface: each prefixed locale has exactly one `$lang` twin of
 * every public page, the twin 404s a language the site does not serve, and the
 * canonical/hreflang set matches the URL the visitor is on.
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

const runHead = (route: RouteLike, lang: string) =>
  route.options.head!({ params: { lang }, search: {}, loaderData: undefined });

const runBeforeLoad = (route: RouteLike, lang: string) =>
  route.options.beforeLoad!({ params: { lang }, search: {}, location: { href: "/" }, context: {} });

const link = (head: ReturnType<typeof runHead>, rel: string, hrefLang?: string) =>
  head.links.find((l) => l.rel === rel && (hrefLang === undefined || l.hrefLang === hrefLang))
    ?.href;

const titleOf = (head: ReturnType<typeof runHead>) => head.meta.find((tag) => tag.title)?.title;

async function routes() {
  const [index, faq, macro, indicators, privacy, terms, freeChannel, ebooks] = await Promise.all([
    import("../$lang/index"),
    import("../$lang/faq"),
    import("../$lang/macro"),
    import("../$lang/indicators"),
    import("../$lang/privacy"),
    import("../$lang/terms"),
    import("../$lang/free-channel"),
    import("../$lang/ebooks.$slug"),
  ]);
  return {
    index: index.Route as unknown as RouteLike,
    faq: faq.Route as unknown as RouteLike,
    macro: macro.Route as unknown as RouteLike,
    indicators: indicators.Route as unknown as RouteLike,
    privacy: privacy.Route as unknown as RouteLike,
    terms: terms.Route as unknown as RouteLike,
    freeChannel: freeChannel.Route as unknown as RouteLike,
    ebooks: ebooks.Route as unknown as RouteLike,
  };
}

const PREFIXED: Locale[] = ["ms", "zh", "hi", "ar", "sw"];

describe("localizePath / routeLocaleFor", () => {
  it("prefixes every non-English locale and leaves English alone", () => {
    expect(localizePath("/faq", "en")).toBe("/faq");
    for (const locale of PREFIXED) {
      expect(localizePath("/faq", locale)).toBe(`/${locale}/faq`);
      expect(localizePath("/", locale)).toBe(`/${locale}`);
      expect(localizePath("/home", locale)).toBe(`/${locale}`);
      expect(localizePath("/#packages", locale)).toBe(`/${locale}#packages`);
    }
  });

  it("re-prefixes a path that already carries a locale", () => {
    expect(localizePath("/ms/faq", "zh")).toBe("/zh/faq");
    expect(stripLocale("/ar/macro")).toBe("/macro");
    expect(stripLocale("/macro")).toBe("/macro");
  });

  it("reads the locale off a URL, including its own home page", () => {
    expect(routeLocaleFor("/zh")).toBe("zh");
    expect(routeLocaleFor("/ar/faq")).toBe("ar");
    expect(routeLocaleFor("/faq")).toBe("en");
    expect(routeLocaleFor("/dashboard")).toBeUndefined();
  });
});

describe("the $lang twins", () => {
  it("404s a language the site does not serve, and the English prefix", async () => {
    const all = await routes();
    for (const [name, route] of Object.entries(all)) {
      if (name === "ebooks") continue; // validated in its loader, with the slug
      for (const bad of ["fr", "en", "de"]) {
        let thrown: unknown;
        try {
          runBeforeLoad(route, bad);
        } catch (error) {
          thrown = error;
        }
        expect((thrown as { isNotFound?: boolean } | undefined)?.isNotFound, `${name}/${bad}`).toBe(
          true,
        );
      }
      expect(runBeforeLoad(route, "zh"), `${name}/zh`).toBeUndefined();
    }
  });

  it("serves each page's own translated metadata", async () => {
    const { index, faq, indicators } = await routes();

    expect(titleOf(runHead(index, "zh"))).toBe(translations.zh.home_meta_title);
    expect(titleOf(runHead(faq, "ar"))).toBe(translations.ar.faq_meta_title);
    expect(titleOf(runHead(indicators, "sw"))).toBe(translations.sw.indicators_meta_title);
  });

  it("is self-canonical and lists all six locales plus x-default", async () => {
    const { faq } = await routes();
    const head = runHead(faq, "hi");

    expect(link(head, "canonical")).toBe(`${SITE_URL}/hi/faq`);
    for (const locale of ["en" as Locale, ...PREFIXED]) {
      expect(link(head, "alternate", locale)).toBe(`${SITE_URL}${localizePath("/faq", locale)}`);
    }
    expect(link(head, "alternate", "x-default")).toBe(`${SITE_URL}/faq`);
  });
});

describe("sitemap", () => {
  const xml = buildSitemap();
  const block = (path: string) => {
    const at = xml.indexOf(`<loc>${SITE_URL}${path}</loc>`);
    expect(at).toBeGreaterThan(-1);
    return xml.slice(xml.lastIndexOf("<url>", at), xml.indexOf("</url>", at));
  };

  it("lists every locale's FAQ and ebook page", () => {
    for (const locale of PREFIXED) {
      expect(xml).toContain(`<loc>${SITE_URL}/${locale}/faq</loc>`);
      expect(xml).toContain(`<loc>${SITE_URL}/${locale}/ebooks/mapping-like-a-pro</loc>`);
    }
  });

  it("gives every member of a cluster the same full alternate set", () => {
    const faq = block("/ar/faq");
    for (const locale of ["en" as Locale, ...PREFIXED]) {
      expect(faq).toContain(`hreflang="${locale}"`);
    }
    expect(faq).toContain(`hreflang="x-default" href="${SITE_URL}/faq"`);
  });
});
