# TDD evidence — SEO / AEO / GEO fixes

Source plan: the SEO/AEO/GEO audit in this session (no `*.plan.md` file). The
acceptance gates were `npm test`, `npm run build` and `npm run lint` (pre-existing
errors only).

Runner: `vitest run` via `npm test` (Vitest 5, jsdom). No CI exists in this repo,
so RED/GREEN were captured locally and are recorded here.

## Test specification

| # | What is guaranteed | Test file / command | Type | Result | Evidence |
|---|--------------------|---------------------|------|--------|----------|
| 1 | `localizedHead()` declares real 1200x630 og:image dimensions | `src/lib/__tests__/seo.test.ts` | unit | PASS | `npm test` |
| 2 | `twitter:description` defaults to the page description | `src/lib/__tests__/seo.test.ts` | unit | PASS | `npm test` |
| 3 | `theme-color` and `og:site_name` are emitted on every route | `src/lib/__tests__/seo.test.ts` | unit | PASS | `npm test` |
| 4 | `msPath: null` emits zero `ms` hreflang links | `src/lib/__tests__/seo.test.ts` | unit | PASS | `npm test` |
| 5 | `OG_IMAGES.default` is a real 1200x630 PNG | `src/lib/__tests__/seo.test.ts` | unit | PASS | `npm test` |
| 6 | A registry slug resolves to its real URL and width | `src/lib/__tests__/seo.test.ts` | unit | PASS | `npm test` |
| 7 | `buildBreadcrumbJsonLd()` honours an explicit crumb name | `src/lib/__tests__/seo.test.ts` | unit | PASS | `npm test` |
| 8 | `ebookHead()` keeps the BreadcrumbList AND adds a Book node with `numberOfPages`, `bookFormat`, `url` | `src/routes/__tests__/ebook-head.test.ts` | unit | PASS | `npm test` |
| 9 | The sitemap gives `/ms` its own `<loc>` and `/home` its twin alternates | `src/routes/__tests__/sitemap.test.ts` | unit | PASS | `npm test` |
| 10 | `/` emits no alternates in the sitemap | `src/routes/__tests__/sitemap.test.ts` | unit | PASS | `npm test` |
| 11 | The sitemap lists `/llms.txt` and `/.well-known/security.txt` | `src/routes/__tests__/sitemap.test.ts` | unit | PASS | `npm test` |
| 12 | `/llms.txt` and `/.well-known/security.txt` serve `text/plain` | `src/routes/__tests__/geo-routes.test.ts` | integration | PASS | `npm test` |
| 13 | `buildLlmsTxt()` lists the key URLs and every ebook from site data | `src/lib/__tests__/geo.test.ts` | unit | PASS | `npm test` |
| 14 | `buildSecurityTxt()` has a Contact, a Canonical and a future Expires | `src/lib/__tests__/geo.test.ts` | unit | PASS | `npm test` |
| 15 | `imgProps()` returns real width/height for known images (CLS) | `src/lib/__tests__/responsive-images.test.ts` | unit | PASS | `npm test` |
| 16 | `imgProps()` carries intrinsic size for un-resized artwork | `src/lib/__tests__/responsive-images.test.ts` | unit | PASS | `npm test` |
| 17 | `Welcome.tsx` lists the page `<h1>` before any `<h2>` in source order | `src/components/landing/__tests__/welcome-headings.test.ts` | unit | PASS | `npm test` |

RED evidence: the original `src/lib/__tests__/seo.test.ts` failed 4 of 5 tests
before `src/lib/seo.ts` was rewritten (missing `theme-color`, missing
`og:site_name`, no default `twitter:description`, and an `ms` hreflang emitted
when `msPath: null`). Every later spec was written against the pre-change code
first and failed on import/assert before the fix landed.

GREEN: `npm test` → 7 files, 22 tests passing.

## Coverage and known gaps

- No coverage threshold is configured in this repo, so no coverage number is
  claimed.
- `npm run build` succeeds (the Lovable-backed `vite.config.ts` is untouched).
- `npm run lint` reports the same error count as `main` for every touched file
  (verified file by file). The repo has ~2100 pre-existing prettier errors on
  `main`; none were introduced here.
- `public/og-default.png` is a real 1200x630 PNG (verified with PIL).

## Merge evidence

The three checkpoint commits (`chore(test)`, `test(seo)`, `fix(seo)`) are on the
active branch; if the PR is squash-merged, this table is the RED/GREEN summary
that must be preserved in the squash commit body.
