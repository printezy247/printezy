# EzyMap marketing experience refresh

## Reference flow

- [Framer](https://www.framer.com/): clear CTA, product demonstration before the deep catalog, and progressive feature disclosure.
- [Apple](https://www.apple.com/): a spacious lead visual, concise product stories, and a direct next step for every product.
- [Forex Factory](https://www.forexfactory.com/calendar): calendar controls for date, impact (including holidays), currency, and event type. The public page returned HTTP 403 during research; the public weekly feed was accessible. Our categories are inferred from release titles, not supplied by the feed.
- The local EzyMap design and video systems supply the light palette, typography, source meshes, and motion treatment. The implementation follows the reference flow, not a pixel-for-pixel copy.

## Implementation

1. `/`: compact link hub, a dedicated `/home` CTA, and a prerendered mascot loop with a poster fallback. No WebGL runs on this page.
2. `/home`: light signal-stack film → ecosystem orbit → interactive signal anatomy → overlapping product panels → next actions. Signals are illustrative. Motion has pause controls and respects the OS preference.
3. Public tabs share the light palette and matching marks. Auth, account, payment processing and checkout confirmation aren't part of the redesign.
4. `/macro`: calendar first, then the sentiment indices on mobile. Filters combine with each other; dates are New York session dates and release times use the visitor's timezone. The date picker only offers days returned by the provider.

Regenerate both video loops and posters with `python3 scripts/render-light-marketing.py ../ezymap-design-system` (NumPy, Pillow, FFmpeg).
