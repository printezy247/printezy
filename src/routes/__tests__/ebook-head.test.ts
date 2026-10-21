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

    const bookNode = nodes.find((n) => n["@type"] === "Book");
    expect(bookNode.numberOfPages).toBe(book.pages);
    expect(bookNode.bookFormat).toBe("Ebook");
    expect(bookNode.url).toBe(`${SITE_URL}/ebooks/${book.slug}`);
    expect(bookNode.inLanguage).toBe(book.language);
  });
});
