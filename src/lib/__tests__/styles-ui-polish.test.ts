import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Pins the site-wide UI polish added in the ui/ux refresh: brand selection,
// visible focus rings, balanced headings, the reading-progress hairline and
// the frosted scrolled header. Same convention as styles-reduced-motion.test.ts.

const css = readFileSync(resolve(__dirname, "../../styles.css"), "utf8");

describe("styles.css UI polish", () => {
  it("tints text selection with the brand primary", () => {
    expect(css).toMatch(/::selection\s*\{[^}]*var\(--primary\)/s);
  });

  it("gives keyboard focus a visible brand ring", () => {
    const block = css.match(/:focus-visible\s*\{([^}]*)\}/s);
    expect(block?.[1]).toContain("var(--ring)");
  });

  it("balances heading line breaks", () => {
    expect(css).toMatch(/h1,\s*\n?\s*h2,\s*\n?\s*h3\s*\{[^}]*text-wrap:\s*balance/s);
  });

  it("defines the fixed reading-progress hairline", () => {
    const block = css.match(/\.scroll-progress\s*\{([^}]*)\}/s);
    expect(block?.[1]).toContain("position: fixed");
    expect(block?.[1]).toContain("var(--primary)");
    expect(block?.[1]).toContain("var(--accent)");
  });

  it("frosts the header once scrolled, with reduced-motion opt-out", () => {
    const block = css.match(/\.site-header--scrolled\s*\{([^}]*)\}/s);
    expect(block?.[1]).toContain("backdrop-filter");
    const reduced = css.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.site-header\s*\{[^}]*transition:\s*none/s,
    );
    expect(reduced).not.toBeNull();
  });
});
