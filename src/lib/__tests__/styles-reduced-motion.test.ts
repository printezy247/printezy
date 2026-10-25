import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// P3.3: the signal board's motion is only kind when the CSS actually says so.
// These tests pin the prefers-reduced-motion coverage for the signal selectors
// so a styles.css refactor cannot silently drop it.

const css = readFileSync(resolve(__dirname, "../../styles.css"), "utf8");

/** Every balanced `@media (prefers-reduced-motion: reduce) { … }` block body. */
function reducedMotionBlocks(source: string): string[] {
  const blocks: string[] = [];
  const marker = "@media (prefers-reduced-motion: reduce)";
  let from = 0;
  for (;;) {
    const at = source.indexOf(marker, from);
    if (at === -1) break;
    const open = source.indexOf("{", at);
    let depth = 1;
    let i = open + 1;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") depth -= 1;
      i += 1;
    }
    blocks.push(source.slice(open + 1, i - 1));
    from = i;
  }
  return blocks;
}

const blocks = reducedMotionBlocks(css);
const allBlocks = blocks.join("\n");

describe("styles.css prefers-reduced-motion coverage", () => {
  it("has at least one reduced-motion block", () => {
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("globally collapses animation and transition durations", () => {
    expect(allBlocks).toMatch(/\*[^{]*\{[^}]*animation-duration:\s*0\.01ms/s);
    expect(allBlocks).toMatch(/\*[^{]*\{[^}]*transition-duration:\s*0\.01ms/s);
  });

  it("switches off the signal card entrance animation", () => {
    // .signal-card must sit in a rule that disables animation.
    const covered = blocks.some((b) => /\.signal-card/.test(b) && /animation:\s*none/.test(b));
    expect(covered).toBe(true);
  });

  it("switches off the live rail fill transition and its glow", () => {
    const covered = blocks.some(
      (b) =>
        /\.signal-rail__fill/.test(b) &&
        (/transition:\s*none/.test(b) || /animation:\s*none/.test(b)),
    );
    expect(covered).toBe(true);
  });

  it("switches off the score ring transition", () => {
    const covered = blocks.some((b) => /\.score-ring/.test(b) && /transition:\s*none/.test(b));
    expect(covered).toBe(true);
  });

  it("switches off the status flag pulse and the idle rail stripe", () => {
    expect(allBlocks).toMatch(/\.signal-flag\[data-pulse\][^,{]*[^}]*animation:\s*none/s);
    expect(allBlocks).toMatch(/\.signal-rail__idle[^,{]*[^}]*animation:\s*none/s);
  });
});
