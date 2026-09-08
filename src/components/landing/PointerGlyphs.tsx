import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

/**
 * A field of market glyphs behind the hero that leans toward the cursor.
 *
 * Each glyph drifts on its own, and brightens and pushes away as the pointer
 * nears it — close enough to feel like the surface is aware of you, small
 * enough that it never competes with the headline sitting on top of it.
 *
 * Two things keep it honest. It writes transforms straight to the DOM inside a
 * rAF loop rather than through React state, because a pointermove that
 * re-renders the whole hero is a stutter you can feel; and it is inert until
 * the pointer is actually over the hero, so an idle page costs nothing. Under
 * reduced motion, or on a device with no fine pointer, it renders nothing at
 * all.
 */

const GLYPHS = [
  // Placed around the headline column rather than across it — a glyph drifting
  // behind live text reads as a rendering fault, however faint it is. The top
  // strip, the two gutters and the footer band are all clear.
  { char: "₿", x: 5, y: 15, size: 34, drift: 0 },
  { char: "▲", x: 17, y: 7, size: 20, drift: 1 },
  { char: "$", x: 31, y: 14, size: 26, drift: 2 },
  { char: "◆", x: 44, y: 6, size: 22, drift: 3 },
  { char: "€", x: 56, y: 16, size: 24, drift: 1 },
  { char: "¥", x: 4, y: 47, size: 28, drift: 2 },
  { char: "£", x: 3, y: 79, size: 24, drift: 0 },
  { char: "▼", x: 21, y: 93, size: 18, drift: 3 },
  { char: "▲", x: 37, y: 88, size: 16, drift: 2 },
  { char: "◆", x: 50, y: 96, size: 18, drift: 1 },
  { char: "$", x: 95, y: 21, size: 20, drift: 3 },
  { char: "▼", x: 97, y: 63, size: 16, drift: 0 },
];

/** How near the pointer has to be, in px, before a glyph reacts at all. */
const REACH = 190;

export function PointerGlyphs() {
  const reducedMotion = usePrefersReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    if (reducedMotion) return;
    // A coarse pointer has no hover to track, and the effect would only ever
    // fire on tap. Leave those devices with the plain drift.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const root = host.current;
    if (!root) return;
    const section = root.parentElement ?? root;
    const nodes = Array.from(root.children) as HTMLElement[];

    let frame = 0;
    let running = false;

    const draw = () => {
      const box = root.getBoundingClientRect();
      const { x, y, active } = pointer.current;
      let stillMoving = false;

      for (const node of nodes) {
        const nx = box.left + (Number(node.dataset.x) / 100) * box.width;
        const ny = box.top + (Number(node.dataset.y) / 100) * box.height;
        const dx = nx - x;
        const dy = ny - y;
        const distance = Math.hypot(dx, dy);

        // 1 right under the cursor, 0 at the edge of REACH and beyond.
        const pull = active && distance < REACH ? 1 - distance / REACH : 0;
        if (pull > 0.001) stillMoving = true;

        const eased = pull * pull; // falls away fast, so only the nearest few lift
        const push = eased * 26;
        const angle = distance === 0 ? 0 : Math.atan2(dy, dx);

        node.style.setProperty("--gx", `${Math.cos(angle) * push}px`);
        node.style.setProperty("--gy", `${Math.sin(angle) * push}px`);
        node.style.setProperty("--gs", `${1 + eased * 0.55}`);
        node.style.setProperty("--go", `${0.1 + eased * 0.75}`);
      }

      // Keep animating while anything is still settling, then stop dead.
      if (active || stillMoving) {
        frame = requestAnimationFrame(draw);
      } else {
        running = false;
      }
    };

    const kick = () => {
      if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    };

    const onMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY, active: true };
      kick();
    };
    const onLeave = () => {
      pointer.current.active = false;
      kick();
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div ref={host} aria-hidden="true" className="pointer-glyphs">
      {GLYPHS.map((glyph, i) => (
        <span
          key={i}
          className={`pointer-glyph pointer-glyph--d${glyph.drift}`}
          data-x={glyph.x}
          data-y={glyph.y}
          style={{
            left: `${glyph.x}%`,
            top: `${glyph.y}%`,
            fontSize: `${glyph.size}px`,
          }}
        >
          {glyph.char}
        </span>
      ))}
    </div>
  );
}
