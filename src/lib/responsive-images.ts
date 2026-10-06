/**
 * Responsive WebP versions of the site's large PNG artwork. The original PNG
 * URLs stay as identifiers (and as og:image / JSON-LD values, which crawlers
 * expect as PNG/JPG); anything rendered in an <img> should spread imgProps().
 */
const VARIANTS: Record<string, Array<[number, string]>> = {
  "jack-photo.png": [
    [480, "/__l5e/assets-v1/5257ec06-02cc-4487-b56e-20282acfbe31/jack-photo-480.webp"],
    [960, "/__l5e/assets-v1/935aadc6-c86f-4e0a-9c2f-25a0104a3bf0/jack-photo-960.webp"],
  ],
  "ezymap-logo.png": [
    [480, "/__l5e/assets-v1/8c0d0488-c958-4bf7-b866-2dc28399c4fe/ezymap-logo-480.webp"],
    [960, "/__l5e/assets-v1/c2f0c3ab-7819-43ff-8ec1-3dd6ca7928e1/ezymap-logo-960.webp"],
  ],
  "macro-logo.png": [
    [480, "/__l5e/assets-v1/021041bb-4b9e-4e6d-8035-1bc8c863f16a/macro-logo-480.webp"],
    [960, "/__l5e/assets-v1/7baa2459-9ede-4b9c-8d99-de5ef5e0e69c/macro-logo-960.webp"],
  ],
  "ebook-mapping-like-pro.png": [
    [480, "/__l5e/assets-v1/b016745b-d0c9-47ee-81f8-8aa915619a44/ebook-mapping-like-pro-480.webp"],
    [960, "/__l5e/assets-v1/36792b7b-27b2-4913-9249-b7277154d1d7/ebook-mapping-like-pro-960.webp"],
  ],
  "ebook-technical-analysis.png": [
    [480, "/__l5e/assets-v1/b08126a4-948a-4085-81a7-eaf06080b1d0/ebook-technical-analysis-480.webp"],
    [960, "/__l5e/assets-v1/1bbdcc04-51af-43c9-95ea-bd36278d5aa9/ebook-technical-analysis-960.webp"],
  ],
  "mt5-logo.png": [
    [480, "/__l5e/assets-v1/d043b11a-42ab-4fc4-9dc3-5353477dacc6/mt5-logo-480.webp"],
  ],
};

function keyFor(url: string): string {
  const file = url.split("?")[0].split("/").pop() ?? "";
  // Vite-hashed local imports look like mt5-logo-AbC123.png
  return VARIANTS[file] ? file : file.replace(/-[A-Za-z0-9_]{6,}\.png$/, ".png");
}

/** { src, srcSet, sizes } for an image URL; passes unknown URLs through. */
export function imgProps(url: string, sizes = "(max-width: 640px) 90vw, 480px") {
  const v = VARIANTS[keyFor(url)];
  if (!v) return { src: url };
  return {
    src: v[v.length - 1][1],
    srcSet: v.map(([w, u]) => `${u} ${w}w`).join(", "),
    sizes,
  };
}
