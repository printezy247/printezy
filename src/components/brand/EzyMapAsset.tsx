import type { ImgHTMLAttributes } from "react";

export type EzyMapProduct =
  | "channel"
  | "miniapp"
  | "bot"
  | "ticker"
  | "calculators"
  | "exchanges"
  | "pro"
  | "ebooks"
  | "macro-bot";
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  product?: EzyMapProduct;
  logo?: "hero" | "fintech" | "gold" | "mark";
  animated?: boolean;
};

/** Pinned upstream artwork. Animated SVGs contain their own reduced-motion rules. */
export function EzyMapAsset({
  product,
  logo = "mark",
  animated = false,
  className = "",
  alt = "",
  ...props
}: Props) {
  const logos = {
    hero: "ezymap-mark-hero",
    fintech: "ezymap-hero-fintech",
    gold: "ezymap-hero-gold",
    mark: "ezymap-3d-mark",
  };
  const src = product
    ? `/brand/ezymap/products/ezymap-${product}-icon-${animated ? "animated" : "extrude"}.svg`
    : `/brand/ezymap/logos/${logos[logo]}.svg`;
  return (
    <img
      src={src}
      alt={alt}
      width={512}
      height={512}
      decoding="async"
      className={`ezm-asset ${className}`}
      {...props}
    />
  );
}
