# EzyMap marketing experience refresh

## Reference flow

- [Framer](https://www.framer.com/): clear CTA, product demonstration before the deep catalog, and progressive feature disclosure.
- [Apple](https://www.apple.com/): a spacious lead visual, concise product stories, and a direct next step for every product.
- [Forex Factory](https://www.forexfactory.com/calendar): calendar controls for date, impact (including holidays), currency, and event type. The public page returned HTTP 403 during research; the public weekly feed was accessible. Our categories are inferred from release titles, not supplied by the feed.
- The local EzyMap design and video systems supply the light palette, typography, source meshes, and motion treatment. The implementation follows the reference flow, not a pixel-for-pixel copy.

## Implementation

1. `/`: compact link hub, a dedicated `/home` CTA, and the eight-second gaze cycle from `assets/3d/preview.html` captured with its original OBJ, materials, camera, and animator. No WebGL runs on the public page; pointer tracking and drag-to-orbit are not part of the video.
2. `/home`: chart-desk film → ecosystem orbit → interactive signal anatomy → overlapping product panels → next actions. The opening pairs live HTML copy with a light adaptation of `video-system/videos/ezymap-hero-loop-16x9`. Candles, trendline, SL/TP overlays, traveling pulse and gem follow the upstream timeline. The example is labeled in the visitor's language, not baked into the film as live data.
3. Public tabs share the light palette and matching marks. Auth, account, payment processing and checkout confirmation aren't part of the redesign.
4. `/macro`: calendar first, then the sentiment indices on mobile. Filters combine with each other; dates are New York session dates and release times use the visitor's timezone. The date picker only offers days returned by the provider.

Regenerate the two current films and posters with `NODE_PATH="$(npm root -g)" node scripts/render-preview-films.cjs ../ezymap-design-system ../EzyMap/video-system/videos/ezymap-hero-loop-16x9`. This optional offline tool needs Chromium (`CHROME_BIN` to override), FFmpeg, and `puppeteer-core` installed locally or globally. Set `FILM=hero` or `FILM=mascot` to export just one. The older Python renderer produces the superseded signal-stack and turntable media, not the current hero.
