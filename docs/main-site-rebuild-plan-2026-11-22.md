# EzyMap website rebuild

Date: 22 November 2026. Status: implementation complete; release verification in progress.

## Goal and scope

Rebuild the main marketing experience at `/home` and its five translated twins, and refine the `/` landing/link hub with the latest EzyMap 3D and animation assets. Keep the working TanStack Start/React application, purchasing, Telegram delivery, analytics and public URLs. The user approved autonomous implementation, verification and deployment through Lovable after this plan was written. Permission controls still apply.

The main page should explain the trading desk, demonstrate its format, help visitors choose a product, and lead them to the free channel or a paid plan. The link hub should get social visitors to their destination quickly.

## Research and decisions

Sources inspected on 22 November 2026:

| Source                                                                                                                                                                                                                                                                        | Observed finding                                                                                                                                               | Application                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [EzyMap README](https://github.com/printezy247/ezymap-design-system/blob/main/README.md), [changelog](https://github.com/printezy247/ezymap-design-system/blob/main/CHANGELOG.md), [tokens](https://github.com/printezy247/ezymap-design-system/blob/main/tokens/tokens.json) | Default-branch documentation and tokens identify v2.4.0; 16 components, animated and extruded product assets, spring timing, 3D/scroll/hero motion stylesheets | Use authentic EzyMap assets and tokens, with a local asset provenance record. Verify the source revision before copying.                             |
| [Framer](https://www.framer.com/)                                                                                                                                                                                                                                             | Homepage leads with a clear product statement and action, demonstrates the product canvas, then explains capabilities and showcases real work                  | Put a usable signal demonstration and product experience ahead of long feature lists; provide short, distinct chapters.                              |
| [Apple](https://www.apple.com/)                                                                                                                                                                                                                                               | Homepage groups products into prominent visual stories with brief headlines and paired discovery/purchase actions                                              | Give the hero breathing room and show each product with a clear next action; use different section scales instead of an uninterrupted grid of cards. |

Website research above is based on retrieved page content and image descriptions. Exact animation timing and responsive geometry have not been measured; these are design recommendations, not claims that those sites implement our chosen effects.

### Visual direction

“The trading desk, made clear”: a cinematic EzyMap gem and product stage, quiet navigation, generous typography, and practical product demonstrations. Green leads; gold identifies premium details and stays under roughly 20% of a view. Avoid copying Apple imagery, branding or Framer interface artwork.

| Role            | Decision                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Background      | `#0a0c0b`                                                                                                                      |
| Surface         | `#141817`                                                                                                                      |
| Raised surface  | `#1e2321`                                                                                                                      |
| Foreground      | `#f2f4f2`                                                                                                                      |
| Primary         | `#2fbf71`                                                                                                                      |
| Accent          | `#c9a13a`                                                                                                                      |
| Display         | Clash Display; Space Grotesk/system fallback                                                                                   |
| Body            | General Sans; Inter Tight/system fallback                                                                                      |
| Trading figures | JetBrains Mono; IBM Plex Mono fallback                                                                                         |
| Layout          | Centered hero; left-aligned product explanations; wide demonstration panels; compact comparison and FAQ                        |
| Motion          | One coordinated hero entrance; gentle gem motion; interaction-driven depth; static reduced-motion and touch-friendly fallbacks |

The memorable feature is the EzyMap 3D gem and desk. Decorative motion must not compete with prices, reading, or checkout. Existing contrast improvements take precedence over blindly copying older token values.

## Current implementation and preservation requirements

- `/` uses `LinkHub.tsx`; `/home` and `/$lang/` use `Landing.tsx`.
- Supported locales are English, Malay, Chinese, Hindi, Arabic and Swahili. Preserve localized routing, metadata and RTL behavior.
- `Landing.tsx` currently combines hero, sample chart, product stage, pricing, ebooks, proof, onboarding and analytics. Split presentation into focused modules where useful.
- `SiteChrome.tsx` is shared by other pages; validate navigation beyond the homepage.
- Existing uncommitted edits remove hero statistic cards, move proof ahead of pricing, and add ticker pause/play. Preserve their intent and do not discard unrelated work.
- Reuse `CATALOG`, `BuyButton`, `useBotLink`, localization helpers, consent-aware analytics, demo-price calculation and existing product URLs.
- Preserve package SKU anchors used by `home.tsx` Product/Offer structured data. Preserve section IDs used by analytics or update both ends together.
- Honor `EZYAI_BOARD_VISIBLE`. A simulated signal must be labeled as an example, never as live market data. Unavailable market data must not be invented.

## Proposed page structure

### Main site

1. Compact shared navigation, locale/account controls, accessible market ticker.
2. New hero: concise existing localized headline, two primary actions, official animated EzyMap gem and dimensional product composition.
3. Product demonstration: existing interactive signal tabs and calculated chart, clearly labeled as sample data.
4. Product discovery: free community, indicators/tools, ebooks and macro desk with official product illustrations and working destinations.
5. Evidence: existing proof and track-record content, keeping limitations and source context.
6. Plans: existing catalog-driven purchase behavior and SKU anchors in a clearer comparison layout.
7. Learning and tools: existing ebook previews, indicators, classes and onboarding paths, visually consolidated.
8. FAQ, support and final action; complete legal footer.

### Landing/link hub

1. Official animated/3D EzyMap identity and short introduction.
2. Four immediately available destinations, with dimensional product icon tiles.
3. Secondary destinations, social profiles, FAQs and language picker.
4. Retain affiliate disclosure and risk text. Keep all current tracking events and link targets.

## Implementation tasks and acceptance criteria

- [x] **P0 — Research and write this plan.** Inspect current routes, pending changes, design-system sources and both reference websites. Record scope and decisions before editing application code.
- [x] **P1 — Baseline and source provenance.** Record current checks and source revision; inventory required assets. Copy only selected design-system assets into the app, with a manifest/provenance document. Avoid installing a private runtime dependency requiring deployment credentials. Done when every imported file exists and its origin is documented.
- [x] **P2 — Brand foundation.** Add scoped page styles, typography and a reusable EzyMap asset component. Integrate required 3D/animation utilities without leaking broad styles across account or checkout screens. Load only necessary fonts and retain script-appropriate fallbacks. Done when the shared shell and both pages render with consistent tokens and no missing assets.
- [x] **P3 — Main-site rebuild.** Replace the hero and page composition, introduce product discovery and clear visual chapters, and integrate existing functional sections. Use actual EzyMap hero/product SVGs, not substitute emoji or invented logos. Done when `/home` and localized twins expose all existing purchase, product and support journeys in the new layout.
- [x] **P4 — Landing refinement.** Upgrade `LinkHub.tsx` with the official 3D identity and product tiles, responsive layout and restrained motion. Done when all main/secondary/social links, FAQs and language controls work and labels fit narrow screens.
- [x] **P5 — Motion and accessibility.** Apply reduced-motion handling, visible focus, accessible menus and at least 44px primary touch targets. Ensure no hover-only essential content and no animation-blocked navigation. Provide static alternatives to animated media. Done when keyboard and reduced-motion reviews pass on both pages.
- [x] **P6 — Functional and localization verification.** Preserve pricing, SKU anchors, analytics IDs, demo calculations, consent boundaries, six locales and RTL. Add focused regression checks for new contracts rather than tests that merely mirror CSS. Done when affected tests and existing project checks pass, with unrelated baseline failures documented separately.
- [ ] **P7 — Visual and performance review.** Inspect desktop and mobile renderings, missing images, horizontal overflow, console/hydration errors, contrast and font fallbacks. Test the production build and existing bundle budget script. Aim for LCP <=2.5s and CLS <=0.1; report measured results only, without treating lab observations as field guarantees.
- [ ] **P8 — Documentation and release.** Update this checklist with implementation evidence and any remaining limitations. Publish tested source through the repository's available GitHub workflow, retaining user edits. Identify the linked Lovable project, deploy through its supported UI/integration, and verify `/` and `/home` on the published domain. A successful Git push alone does not prove Lovable publication. If access is unavailable, document the exact blocker and do not claim deployment.

## Implementation locations

| Path                                    | Intended work                                                |
| --------------------------------------- | ------------------------------------------------------------ |
| `src/components/landing/Landing.tsx`    | Main page composition and existing functional sections       |
| `src/components/landing/LinkHub.tsx`    | Refined social landing experience                            |
| `src/components/landing/SiteChrome.tsx` | Shared identity, navigation and preserved ticker controls    |
| `src/components/brand/`                 | Reusable official logo/product asset rendering               |
| `src/styles.css` and new scoped CSS     | Font roles, responsive composition, motion and accessibility |
| `public/brand/ezymap/`                  | Selected versioned upstream SVG/motion assets                |
| `src/lib/translations/`                 | Any new visitor-facing copy in all supported languages       |
| `docs/`                                 | Asset provenance and final verification/deployment evidence  |

## Verification and rollout

Run the repository's lint, TypeScript, Vitest and production build checks, then `node scripts/check-bundle.mjs`. Inspect both pages at approximately 390px and 1440px widths, and check 320px overflow. Exercise navigation, FAQ, locale switching, demo tabs and purchase entry points without placing a real order. Review one RTL rendering and reduced motion. Check shared-shell routes for regression.

Keep the rebuild in reviewable commits, with this plan recorded before application changes. Preserve the existing backend and deployment architecture. After publication, check the live pages for the new asset URLs and visible content. Rollback is the previous known-good application revision through the same Lovable publish flow; no database rollback should be necessary.

## Execution log

- Planning: repository and upstream v2.4.0 sources reviewed; plan written before build.
- User scope update: landing/link hub explicitly included; user authorized autonomous completion and Lovable deployment.

- Source assets pinned to `80a753f808ed4a46e68906fc07fa9e1949502e1a` (v2.4.0); 23 SVG files, with provenance at `public/brand/ezymap/provenance.json`. Local upstream uncommitted changes were excluded.
- Rebuilt composition in `Landing.tsx`, new `LaunchHero.tsx` and `ProductDiscovery.tsx`; existing commerce/demo modules extracted into `LandingSections.tsx`.
- Landing/link hub upgraded to a two-column desktop layout and a single-column mobile layout, with official product tiles and animated hero. Product assets animate on hover or keyboard focus. Logo animation can be paused; reduced-motion SVG fallbacks remain intact.
- Removed the automatic first-visit dialog from the marketing composition; its channel/support destinations remain accessible through page actions and navigation.
- Preserved existing ticker pause/play and proof-before-pricing changes, including concurrent commit `3f2b0b7`. Ticker now identifies unavailable data rather than showing a Live label for an empty feed.
- Six-locale render/destination regression checks, animation pause/restart interaction test and asset/reduced-motion checks added. Existing ebook aspect-ratio test follows its extracted component.
- Initial full checks passed: lint (two existing fast-refresh warnings), TypeScript, all tests and production build. Entry bundle: 597 KB, below the unchanged 620 KB budget. Final rerun follows the last interaction refinements.
- Static browser render review completed at 1440px and 390px for the hero/product discovery and link hub. No missing artwork. A decorative orbit overflow identified in the standalone hero fixture was fixed with scoped clipping. Full live route review follows publication; static fixture testing does not establish live backend or hydration behavior.
- Local dev-server startup is prohibited by the environment (`listen EPERM`); Git metadata is read-only. GitHub connector used for source publication. Lovable connection is now available and the existing project matches the repository HEAD.
