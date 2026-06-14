# PrintEzy Landing Page Plan

A single-page, professional, futuristic landing page with a 3D feel in a green / gold / black palette, targeting traders from newbies to experts as well as busy professionals.

## Sections (top to bottom)

1. **Sticky nav** — PrintEzy wordmark left, anchor links (Features, Testimonials) + a small gold CTA right.
2. **Hero**
   - Headline: "Jack" (as provided) with a supporting subheadline like "Trading clarity for newbies, pros, and busy professionals."
   - Animated 3D backdrop: layered green/gold gradient orbs, subtle grid floor, faint candlestick silhouettes — pure CSS/SVG, no heavy 3D libs.
   - Three primary CTAs side-by-side (stack on mobile):
     - FREE EBOOK → external URL (placeholder `#`)
     - FREE ANALYSIS → external URL (placeholder `#`)
     - FREE CHANNEL → external URL (placeholder `#`)
   - Each button has an icon, a one-line value prop under the label, and a subtle hover lift + gold glow.
3. **Trust strip** — thin row of metrics (e.g. "10k+ traders • 4.9★ rating") to add credibility without clutter.
4. **Features / What you get** — 4 cards on a glassmorphic dark surface with gold accent borders. Each card: icon, title, 1-sentence description. Tailored to the audience (e.g. "Beginner-friendly playbooks", "Pro-level market analysis", "Live signals channel", "Designed for busy schedules").
5. **Testimonials** — 3-card grid with avatar, name, role (e.g. "Software Engineer", "Full-time Trader"), short quote, gold star rating.
6. **Final CTA band** — repeats the 3 buttons on a dramatic green-to-black gradient with gold accent line.
7. **Footer** — minimal: brand, small links, copyright.

## Design system

Tokens defined in `src/styles.css` under `@theme` (no hardcoded colors in components):

- Background: deep black `oklch(0.15 0.02 150)`
- Surface: near-black with green tint
- Primary (emerald green) + primary-glow for gradients
- Accent (gold) + accent-glow
- Foreground: warm off-white
- Gradients: `--gradient-hero` (green→black), `--gradient-gold` (gold sheen), `--gradient-glow` (radial green)
- Shadows: `--shadow-gold`, `--shadow-elevated` for 3D depth
- Radius: `1rem` for cards, pill buttons for CTAs

Typography: Space Grotesk (display, headings) + Inter (body), loaded via `<link>` in `__root.tsx`, registered via `--font-display` / `--font-sans` in `@theme`.

Motion: framer-motion for hero entrance + subtle floating orbs + hover lifts on CTAs/cards. Restrained — one hero moment, light micro-interactions elsewhere.

## Technical notes

- Replace `src/routes/index.tsx` placeholder with the landing page.
- Update `head()` meta: title "PrintEzy — Trading Made Simple", matching description, og tags.
- New components under `src/components/landing/`: `Nav`, `Hero`, `CtaButtons`, `Features`, `Testimonials`, `FinalCta`, `Footer`.
- Install `framer-motion` via bun.
- Icons from `lucide-react` (already available via shadcn).
- All 3 CTA buttons render as `<a href="#" target="_blank" rel="noopener">` so URLs can be swapped in later.
- Fully responsive; tested mentally for 390px mobile up to desktop.

## Out of scope (for now)

- Real CTA destination URLs (placeholders used).
- Email capture, FAQ, stats section, pricing.
- Backend / Lovable Cloud (no data persistence needed yet).
