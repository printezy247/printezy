import { describe, it, expect } from "vitest";
import { ebookHead } from "@/routes/ebooks.$slug";
import { EBOOK_PAGES } from "@/lib/ebooks";
import { SITE_URL } from "@/lib/bot/tiers";

describe("ebookHead()", () => {
  it("keeps the BreadcrumbList and adds a Book node with numberOfPages", () => {
    const book = EBOOK_PAGES[0];
    const head = ebookHead(book, "en") as { scripts: Array<{ children: string }> };
    const nodes = head.scripts.map((s) => JSON.parse(s.children));
    const types = nodes.map((n) => n["@type"]);
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("Book");
    expect(types).toContain("Article");

    const bookNode = nodes.find((n) => n["@type"] === "Book");
    expect(bookNode.numberOfPages).toBe(book.pages);
    expect(bookNode.bookFormat).toBe("Ebook");
    expect(bookNode.url).toBe(`${SITE_URL}/ebooks/${book.slug}`);
    expect(bookNode.inLanguage).toBe(book.language);

    const articleNode = nodes.find((n) => n["@type"] === "Article");
    expect(articleNode.headline).toBe(book.title);
    expect(articleNode.inLanguage).toBe(book.language);
  });

  it("treats every locale as an edition of the English page unless one exists", () => {
    const book = EBOOK_PAGES[0];
    type Head = {
      links: Array<{ rel: string; href?: string; hrefLang?: string }>;
      meta: Array<Record<string, string>>;
    };

    // Malay has a written edition, so /ms is its own canonical.
    const ms = ebookHead(book, "ms") as Head;
    expect(ms.links.find((l) => l.rel === "canonical")?.href).toBe(
      `${SITE_URL}/ms/ebooks/${book.slug}`,
    );

    // Chinese has none: the page renders, but it is a view of the English copy.
    const zh = ebookHead(book, "zh") as Head;
    expect(zh.links.find((l) => l.rel === "canonical")?.href).toBe(
      `${SITE_URL}/ebooks/${book.slug}`,
    );
    expect(zh.meta.find((m) => m.property === "og:url")?.content).toBe(
      `${SITE_URL}/ebooks/${book.slug}`,
    );
    expect(zh.links.filter((l) => l.rel === "alternate").map((l) => l.hrefLang)).toEqual([
      "en",
      "ms",
      "x-default",
    ]);
  });

  it("declares the cover's real pixel size as og:image", () => {
    const book = EBOOK_PAGES[0];
    const head = ebookHead(book, "en") as { meta: Array<Record<string, string>> };
    const image = head.meta.find((m) => m.property === "og:image");
    const width = head.meta.find((m) => m.property === "og:image:width");
    const height = head.meta.find((m) => m.property === "og:image:height");
    expect(image?.content).toBe(`${SITE_URL}${book.image}`);
    expect(width?.content).toBe("1240");
    expect(height?.content).toBe("1754");
  });
});
