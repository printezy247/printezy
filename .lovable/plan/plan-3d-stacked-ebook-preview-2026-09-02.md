# Plan: 3D Stacked Ebook Preview

## Goal
Replace the tall ebook cards in the Products section with a compact, premium 3D stacked-preview layout so the CTAs are visible without scrolling and the section feels tactile and high-end.

## What will change

### 1. Ebook section layout
- Remove the current `aspect-[2/3]` full-height cover cards.
- Render each ebook as a horizontal card: a smaller 3D book preview on the left, value props + CTA on the right.
- Keep the two existing ebooks: "Mapping Like A Pro" and "Technical Analysis Ebook".

### 2. 3D book component
- Build a CSS-only 3D book effect using the existing ebook cover images.
- The cover sits at a slight perspective rotation; a darker "spine/back" layer behind it creates depth.
- Add a subtle hover lift/tilt for premium feel.
- No new image assets required.

### 3. Content on the right
- Title in `text-lg font-semibold`.
- 2-3 benefit bullets using existing check-list style.
- Primary CTA: "Get it free" gold-outlined button linking to the existing ebook Telegram link.
- Secondary hint: "PDF sent via Telegram" or similar micro-copy.

### 4. Responsive behaviour
- On desktop: two horizontal ebook cards side-by-side, each ~50% width.
- On mobile: cards stack vertically; the 3D preview shrinks to a compact thumbnail.
- The rest of the Products section (TradingView, MT5, Macro cards) stays unchanged.

### 5. Visual consistency
- Reuse the existing dark metal palette, hairline borders, and 8/12px radii.
- Keep glass-card styling for the card container.
- No white backgrounds, no coloured glows outside the existing tokens.

## Verification
- Typecheck passes.
- Preview checked at 1338×815 and mobile widths to confirm CTAs are visible and no horizontal overflow.
- Existing analytics events for each ebook remain wired.
