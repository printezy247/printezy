import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { EBOOK_PAGES } from "@/lib/ebooks";
import { imgProps } from "@/lib/responsive-images";
import { OG_IMAGES } from "@/lib/seo";

/**
 * The July artwork was uploaded to the Lovable asset store and hardcoded into
 * two places (lib/ebooks.ts and Landing.tsx), so a cover swap missed one of
 * them. These specs pin the new covers to /public and fail if an old
 * asset-store URL creeps back into the code.
 */
const OLD_ASSET_IDS = [
  "b177d46a-680e-4021-ae98-bcc3631ab665",
  "eb540617-0a0b-4444-993e-d90be97af7d7",
];

/** Every source file, except the specs themselves. */
function sourceFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter((p) => /\.tsx?$/.test(p) && !p.includes("__tests__"))
    .map((p) => join(dir, p));
}

describe("ebook covers", () => {
  it("points every ebook at the new cover file in /public", () => {
    for (const book of EBOOK_PAGES) {
      expect(book.image).toMatch(/^\/ebook-cover-[a-z-]+\.png$/);
      expect(existsSync(join("public", book.image))).toBe(true);
    }
  });

  it("serves a webp variant with true dimensions for every cover", () => {
    for (const book of EBOOK_PAGES) {
      const p = imgProps(book.image) as { width: number; height: number; srcSet: string };
      expect(p.width).toBe(960);
      expect(p.height).toBe(1358);
      expect(p.srcSet).toContain("480w");
      expect(p.srcSet).toContain("960w");
    }
  });

  it("leaves no old asset-store cover URL in the source", () => {
    const offenders = sourceFiles("src").filter((file) => {
      const text = readFileSync(file, "utf8");
      return OLD_ASSET_IDS.some((id) => text.includes(id));
    });
    expect(offenders).toEqual([]);
  });

  it("gives every ebook an og:image entry with its real size", () => {
    for (const book of EBOOK_PAGES) {
      const og = OG_IMAGES[book.slug];
      expect(og?.image).toBe(book.image);
      expect(og?.width).toBe(1240);
      expect(og?.height).toBe(1754);
    }
  });

  it("keeps the A4 cover ratio in every box that renders a cover", () => {
    for (const file of ["src/components/landing/Landing.tsx", "src/routes/ebooks.$slug.tsx"]) {
      const text = readFileSync(file, "utf8");
      expect(text).toContain("aspect-[1240/1754]");
      expect(text).not.toContain("aspect-[2/3]");
    }
  });
});
