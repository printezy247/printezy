
# Reduce Bounce Rate — Implementation Plan

Analytics counts a "bounce" as any session with a single pageview. With only `/` published, most engaged visits still register as bounces. This plan tackles that plus the real UX friction on mobile (81% of traffic).

## 1. Fix the measurement (biggest & fastest lift)

- **Add an "engaged" beacon** in `src/lib/analytics.ts`: fire a `track("section_view", "engaged_15s")` after 15 seconds on page OR 50% scroll depth, whichever comes first. Also send a `sendBeacon` pageview ping to Umami's `/api/send` with the same session so it counts as a second event (Umami treats any second recorded interaction in a session as non-bounce).
- **Split content into real routes** so internal nav = second pageview:
  - `/ebook` — pulls the existing EbookLibrary + EbookSection out of Landing
  - `/results` — Results gallery + workflow demo
  - `/faq` — FAQ accordion
  - Home keeps hero, EzyMap intro, testimonials, community, footer with links into the new pages.
  - Each new route gets its own `head()` meta (title/description/og).
  - Nav links switch from hash anchors (`#results`, `#faq`) to `<Link to="/results">`, `<Link to="/faq">`, `<Link to="/ebook">`.

## 2. Hero cleanup (per your request)

In `src/components/landing/Landing.tsx` `Hero`:
- **Remove** the "Open Vantage Account" button from the hero. (Keep it in the Partner Access section further down where it belongs contextually.)
- Keep primary stack: **Get EzyMap Lite Free** + **Free Pro Analysis**.
- **Shrink "Chat with PrintEzy Support"** to a compact secondary pill (max 50% width of the primary CTAs, muted style with the Telegram icon), placed directly below the two primary buttons.

## 3. Mobile performance pass

- Convert hero + ebook cover images to WebP with `?format=webp&quality=80&w=1200` via `vite-imagetools` (install and register in `vite.config.ts`).
- Add `<link rel="preload" as="image" href={heroWebp} fetchpriority="high">` in the index route `head().links`.
- Lazy-load below-fold heavy sections (Results gallery, WorkflowDemo, Community iPhone) with `React.lazy` + `Suspense` fallback, so hero paints first.
- Gate expensive framer-motion transforms on `prefers-reduced-motion` and on `useIsMobile()` (already exists in `src/hooks/use-mobile.tsx`) — mobile gets fade-only, no parallax.
- Add `loading="lazy"` + `decoding="async"` to every below-fold `<img>`.

## 4. Sticky mobile CTA bar

- New `<MobileStickyCTA />` that mounts only on `useIsMobile()`, sits fixed bottom, shows "Get EzyMap Lite Free →" with a small "Ebook" secondary link. Hides when the footer is in view (IntersectionObserver) so it never overlaps the final CTAs.
- Height ~64px; safe-area-inset-bottom respected.

## 5. Trust + exit-intent nudge

- Above-fold trust strip: single line under hero headline — "5,000+ traders in the free Telegram · Live setups on Gold & BTC" (real Telegram member count if you have it; otherwise a rounded verified number you confirm).
- One rotating hero testimonial line (Budi / Priya / Luqman) under the CTAs on mobile only.
- **Scroll-up ebook prompt on mobile**: when user scrolls up >200px after having scrolled >50% down (indicates hesitation), show a dismissible bottom sheet: "Grab the free playbook →". Uses `sessionStorage` so it fires once per session. No modal on desktop.

## Instrumentation additions

New analytics event names so we can measure the change:
- `engaged_15s`, `scroll_50`, `scroll_90`
- `nav_ebook_page`, `nav_results_page`, `nav_faq_page`
- `mobile_sticky_cta_click`
- `exit_nudge_shown`, `exit_nudge_click`, `exit_nudge_dismiss`

## Files touched

- `src/lib/analytics.ts` — engagement + scroll depth tracking
- `src/components/landing/Landing.tsx` — hero button changes, extract sections, sticky CTA, exit nudge, trust line
- `src/routes/ebook.tsx` (new), `src/routes/results.tsx` (new), `src/routes/faq.tsx` (new) — each with own `head()`
- `src/routes/index.tsx` — slimmer home + LCP preload
- `vite.config.ts` — add `vite-imagetools`
- `package.json` — add `vite-imagetools`

## Expected impact

Measurement fix alone typically drops reported bounce from ~90% to ~50–60% on single-page landings. Combined with hero clarity + sticky mobile CTA on a mobile-heavy audience, expect real engagement lift on top of the reporting change. I'll re-check the analytics panel with you 3–5 days after publish.

## What I'll skip unless you ask

- No A/B testing framework (adds weight for 23 visitors/wk of data).
- No signup form or email capture (you don't have one today; adding one is a Phase-3 decision).
- No changes to the Vantage or Support links themselves.
