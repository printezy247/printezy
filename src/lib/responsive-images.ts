/**
 * Responsive WebP versions of the site's large PNG artwork. The original PNG
 * URLs stay as identifiers (and as og:image / JSON-LD values, which crawlers
 * expect as PNG/JPG); anything rendered in an <img> should spread imgProps().
 *
 * Each entry is [width, height, url] with the WebP's real pixel size, so
 * imgProps() can emit width/height attributes and stop the image from shifting
 * layout as it loads. Images with no resized variant (the tier artwork) are
 * listed too, purely so their intrinsic size is available.
 */
const VARIANTS: Record<string, Array<[number, number, string]>> = {
  "jack-photo.png": [
    [480, 480, "/__l5e/assets-v1/5257ec06-02cc-4487-b56e-20282acfbe31/jack-photo-480.webp"],
    [960, 960, "/__l5e/assets-v1/935aadc6-c86f-4e0a-9c2f-25a0104a3bf0/jack-photo-960.webp"],
  ],
  "ezymap-logo.png": [
    [480, 480, "/__l5e/assets-v1/8c0d0488-c958-4bf7-b866-2dc28399c4fe/ezymap-logo-480.webp"],
    [960, 960, "/__l5e/assets-v1/c2f0c3ab-7819-43ff-8ec1-3dd6ca7928e1/ezymap-logo-960.webp"],
  ],
  "macro-logo.png": [
    [480, 480, "/__l5e/assets-v1/021041bb-4b9e-4e6d-8035-1bc8c863f16a/macro-logo-480.webp"],
    [960, 960, "/__l5e/assets-v1/7baa2459-9ede-4b9c-8d99-de5ef5e0e69c/macro-logo-960.webp"],
  ],
  "ebook-cover-mapping-like-a-pro.png": [
    [480, 679, "/ebook-cover-mapping-like-a-pro-480.webp"],
    [960, 1358, "/ebook-cover-mapping-like-a-pro-960.webp"],
  ],
  "ebook-cover-technical-analysis.png": [
    [480, 679, "/ebook-cover-technical-analysis-480.webp"],
    [960, 1358, "/ebook-cover-technical-analysis-960.webp"],
  ],
  "mt5-logo.png": [
    [230, 230, "/__l5e/assets-v1/d043b11a-42ab-4fc4-9dc3-5353477dacc6/mt5-logo-480.webp"],
  ],
  "tier-beginner.jpg": [
    [1672, 941, "/__l5e/assets-v1/174daaab-2584-456e-a536-500846c6e53a/tier-beginner.jpg"],
  ],
  "tier-pro.jpg": [
    [1280, 720, "/__l5e/assets-v1/b081a13c-b17d-495f-addf-bf83f9f20930/tier-pro.jpg"],
  ],
  "tier-premium.jpg": [
    [1672, 941, "/__l5e/assets-v1/aed9ef52-2740-4a48-83db-2b807a45e958/tier-premium.jpg"],
  ],
  "tier-elite.jpg": [
    [1280, 720, "/__l5e/assets-v1/74dd6c4b-6aa9-466c-89ab-b1e0b75b28ac/tier-elite.jpg"],
  ],
};

function keyFor(url: string): string {
  const file = url.split("?")[0].split("/").pop() ?? "";
  // Vite-hashed local imports look like mt5-logo-AbC123.png
  return VARIANTS[file] ? file : file.replace(/-[A-Za-z0-9_]{6,}\.png$/, ".png");
}

/**
 * { src, srcSet, sizes, width, height } for an image URL; unknown URLs pass
 * through as { src } only. width/height are the real pixel dimensions of the
 * served variant, which is what lets the browser reserve space (no CLS).
 */
export function imgProps(url: string, sizes = "(max-width: 640px) 90vw, 480px") {
  const v = VARIANTS[keyFor(url)];
  if (!v) return { src: url };
  const [width, height, src] = v[v.length - 1];
  return {
    src,
    srcSet: v.map(([w, , u]) => `${u} ${w}w`).join(", "),
    sizes,
    width,
    height,
  };
}
