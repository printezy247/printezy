import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders an overlay straight into <body>.
 *
 * A `position: fixed` overlay only measures against the viewport while none of
 * its ancestors carries a transform. The pricing and product cards lift on
 * hover (`.card-lift`), which makes the hovered card the containing block, so a
 * modal opened from a button inside one was drawn inside that card — squeezed
 * into a 250px column instead of covering the page. Portalling past every
 * ancestor removes the whole class of bug, rather than trading the hover
 * effect away for it.
 *
 * The host is picked up in an effect so the first client render matches the
 * server's (these modals are state-gated and never render during SSR, but this
 * keeps that guarantee from being load-bearing).
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(document.body);
  }, []);

  if (!host) return null;
  return createPortal(children, host);
}
