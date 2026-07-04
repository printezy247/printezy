# Ebook Section Refinement Plan

## 1. Replace ebook cover image
- Upload the attached PNG (`/mnt/user-uploads/file_0000000060a4720896f1c9cefe4b9391.png`) via `lovable-assets` as `src/assets/ebook-cover-v2.jpg.asset.json` (jpg re-encoded for smaller size, or keep png).
- Delete the old `src/assets/ebook-cover.jpg.asset.json` pointer.
- Update the import in `Landing.tsx` to point to the new pointer.

## 2. Copy edits in `Landing.tsx`
Text-only changes to existing strings:
- Blurb (line 536-539) → "20 pages that take you from zero to reading charts like the pros. Support & resistance, trendlines, chart patterns, and more distilled into what actually moves your P&L."
- TOC 01 body → "The trader's edge, it's like reading the market's story."
- TOC 03 body → "Dynamic support & resistance the pros actually respect."
- TOC 04 body → "Reversals & continuations spot"
- CTA label "DOWNLOAD THE EBOOK" → "GET EBOOK NOW"
- CTA sub "Instant access via Telegram · no signup" → "No deposit or payment needed"
- Footer note → "Joined by 10,000+ traders. Not financial advice."

## 3. Futuristic 3D upgrade for `EbookSection`
- Wrap the whole content column in a glass "holo card": rounded 2xl, gold gradient border via mask, backdrop-blur, subtle inner shadow, animated conic-gradient glow behind.
- Add tilt on hover for the cover already exists — extend with a rotating gold ring and animated shimmer sweep across the cover.
- TOC list: convert to numbered chips with gold gradient number bubbles, hover raises tile with green glow.
- Download CTA: add pulsing gold aura ring using an absolutely-positioned `motion.span` with `animate={{ scale, opacity }}` loop.
- Tighten responsive spacing: `py-20 md:py-28`, `gap-10 lg:gap-16`, cover max-w tightened to `max-w-xs md:max-w-sm` on desktop so unused whitespace shrinks.

## 4. Smooth scroll + active-section highlight
- Global `html { scroll-behavior: smooth }` already set.
- Add `scroll-mt-24` to `#ebook` so the sticky nav doesn't cover the heading.
- FREE EBOOK CTA already uses `href="#ebook"`; add an `onClick` that also triggers a brief highlight: toggle a `data-highlight` attribute on the section that runs a 1.2s gold ring pulse animation defined as a new `@keyframes ebook-pulse` + `@utility` in `src/styles.css`.
- Implement via a small `useEbookHighlight` hook or inline handler on the CTA button (no router changes).

## 5. Desktop hero layout refinement
- On `lg+`, arrange the two primary CTAs (`FREE EBOOK`, `PRO ANALYSIS`) stacked top-to-bottom in a left column, with `ASK ME ANYTHING` sitting compactly to the right, removing the current wide unused whitespace.
- Change hero CTA container to `flex-col sm:flex-row lg:flex-col lg:max-w-xs` and keep `TelegramAskButton` on its own row/inline as appropriate.
- Trim `Hero` `pb-20` → `pb-16 lg:pb-12` and cap content width so trader image reads better without giant gaps.

## 6. Verification
- Run build.
- Playwright screenshot desktop (1280) and mobile (390) of the ebook section and hero to confirm layout, cover swap, and highlight animation trigger.

## Files touched
- `src/assets/ebook-cover.jpg.asset.json` (deleted)
- `src/assets/ebook-cover-v2.jpg.asset.json` (new)
- `src/components/landing/Landing.tsx` (copy, layout, 3D effects, scroll highlight, hero CTA arrangement)
- `src/styles.css` (new `@keyframes ebook-pulse` + `@utility`)
