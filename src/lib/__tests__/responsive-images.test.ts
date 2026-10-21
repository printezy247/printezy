import { describe, it, expect } from "vitest";
import { imgProps } from "@/lib/responsive-images";

describe("imgProps()", () => {
  it("returns the real dimensions of the served variant (no CLS)", () => {
    const p = imgProps("/ebook-cover-mapping-like-a-pro.png") as {
      width: number;
      height: number;
      srcSet: string;
    };
    expect(p.width).toBe(960);
    expect(p.height).toBe(1358);
    expect(p.srcSet).toContain("960w");
  });

  it("carries the intrinsic size of an image with no resized variant", () => {
    const p = imgProps(
      "/__l5e/assets-v1/174daaab-2584-456e-a536-500846c6e53a/tier-beginner.jpg",
    ) as {
      width: number;
      height: number;
    };
    expect(p.width).toBe(1672);
    expect(p.height).toBe(941);
  });

  it("passes unknown URLs through untouched", () => {
    expect(imgProps("https://example.com/x.png")).toEqual({ src: "https://example.com/x.png" });
  });
});
