# EzyAI Website — Phased Review & Upgrade Recommendations

> **Scope:** the EzyAI section of the **printezy** website (`src/lib/ezyai/`, `src/components/ezyai/`, `src/routes/api/public/ezyai/`, `src/routes/ezyai.tsx`, and the board's CSS/tests). The EzyAi **bot** codebase (tradernonymous/EzyAi) is a separate repo and is not in scope.
>
> **Date:** 2026-10-25 (board relaunch / bot-only track-record reset)

---

## 1. What's Already Shipped (recently)

Three commits closed the major correctness gaps before this review:

| Commit | What it fixed |
|--------|--------------|
| `96226c3` | Public board mirrors the bot; site-side scanner removed |
| `14bc694` | Honest track record — bot-only history, "since" label, small-sample guard |
| `3479eeb` | Track-record window pinned to `2026-10-25T00:00:00Z` |

The website is now a **pure read-only mirror**: the EzyAi bot pushes every live signal (autopilot opens + watch alerts) through the signal bridge; the site stores, serves, and renders what it is told. No Yahoo feeds, no indicators, no autopilot logic remain in the site codebase.

**Tests** pin the contract (`ezyai-board.test.ts`, `ezyai-track-record.test.ts`, `dedup.test.ts`): all 61 pass.

---

## 2. Code Map

### Types & Constants
- `signals.ts` — `EzyAiSignal`, `SignalStatus`, `SignalDirection`, `SIGNAL_STATUSES`, `LIVE_STATUSES`, `CLOSED_STATUSES`, `STATUS_COLOR`, `liveR()`, `progressPercent()`, `entryMid()`, `summarisePerformance()`, `buildingTrackRecord()`, `EZYAI_TRACK_RECORD_SINCE`, `EZYAI_MIN_TRACK_RECORD_SAMPLE`
- `visibility.ts` — `EZYAI_BOARD_VISIBLE: boolean = true` master switch
- `redeem-code.ts` — `generateRedeemCode()`, `normalizeRedeemCode()`, `REDEEM_CODE_RE`
- `dedup.ts` — `findLiveDuplicate()` pure matcher (symbol + direction + setup + 24h window, injectable `now`)

### Server / Database
- `signals.server.ts` — `listLiveSignals()`, `listClosedSignals(.gte("opened_at", EZYAI_TRACK_RECORD_SINCE))`, `pushSignal()` (update-or-insert, 23505 retry), `recordBridgeHit()`, `recentBridgeHits()`
- `signals.functions.ts` — `getEzyAiBoard`, `getEzyAiHistory` (dynamic-import server functions)
- `entitlements.server.ts` — `recordEzyAiEntitlement()`, `listUnclaimedEntitlements()`, `findEntitlementByCode()`, `claimEntitlement()`, `isAuthorizedBotRequest()`
- `site-access.server.ts` — `normalizeHandle()`

### Bridge Endpoints
- `routes/api/public/ezyai/signals.ts` — GET (list/diagnose), POST (single/batch ≤50). Bearer-key auth with `safeEqual()`, SHA-256 fingerprint for diagnostics, 503 when unconfigured, 401 on bad key, 207 for partial batches. `normalise()` strips surrounding quotes/tickers.
- `routes/api/public/ezyai/entitlements.ts` — GET (username/code/sweep lookup), POST (claim). UUID + telegram_id validation.

### Presentation
- `components/ezyai/SignalCard.tsx` — status flag, stop→target rail, score ring, live R, staggered card entry animation, `prefers-reduced-motion`
- `components/ezyai/PerformancePanel.tsx` — build-record guard, equity curve SVG, per-symbol win-rate bars, result list
- `routes/ezyai.tsx` — ARIA tablist (live/history/about), 60s refetch, deep-linkable tabs, keyboard arrow navigation
- `components/brand/EzyAiLogo.tsx` — SVG logo with `useId()` gradient scoping

### Tests
- `lib/__tests__/ezyai-board.test.ts` — board visibility flag, scanner removal, sitemap inclusion, ARIA patterns, i18n consistency
- `lib/__tests__/ezyai-track-record.test.ts` — track-record window (2026-10-25), min-sample guard (10), panel building notice, no fabricated-floor wording
- `lib/ezyai/__tests__/dedup.test.ts` — 7 case tests for `findLiveDuplicate`

### Shared Utilities (reused across EzyAI and the rest of the site)
- `safeEqual()` — defined in `lib/bot/telegram.server.ts`, imported by both `signals.ts` (route) and `entitlements.server.ts`. **Also duplicated** in `lib/telegram-login.server.ts:54` (a third copy).
- `escapeLikePattern()` — `lib/like-escape.ts`
- `useCountUp()`, `usePrefersReducedMotion()` — `lib/`
- `formatLocalTime()`, `formatUsd()`, `getCatalogItem()`, `EZYAI_SKU_MONTHS` — all from `lib/catalog.ts`

### Trending Repos Researched
| Repo | Stars | Relevance |
|------|-------|-----------|
| bennycode/trading-signals | 1.0k | TS financial indicators, tree-shakable exports, JSDoc on every fn |
| Drakkar-Software/OctoBot | 6.9k | Python bot with structured outputs, backtesting engine, strategy registry |
| naimkatiman/tradeclaw | ~500 | AI signal engine with inspectable "outcome ledger" |
| cryptoyasenka/crypto-signal-board | ~200 | Crypto signals in a TEE (confidentiality pattern) |

---

## 3. Findings

### 3.1 Architectural Strengths (keep as-is)

1. **Bot-only write model is correctly enforced.** The test at `ezyai-board.test.ts:29-39` asserts that `autopilot.ts`, `autopilot.server.ts`, `market.server.ts`, `indicators.ts`, and `api/public/ezyai/autopilot.ts` no longer exist. This is the right call — the bot owns state, the site mirrors it.

2. **Track-record honesty is bulletproof.** `listClosedSignals()` filters `.gte("opened_at", EZYAI_TRACK_RECORD_SINCE)` (signals.server.ts:122). The panel shows a "building track record" notice instead of a win rate until 10 closed trades (`buildingTrackRecord()` in PerformancePanel.tsx:134). The test at `ezyai-track-record.test.ts:84-87` explicitly forbids any "guarantee/maintained/at least" wording around win rate.

3. **Dedup logic is pure and testable.** `findLiveDuplicate` takes an injectable `now` parameter and has 7 unit tests. The database layer in `pushSignal` calls it with live rivals (signals.server.ts:287-295).

4. **Bridge is idempotent and race-safe.** Update-or-insert pattern (not upsert) with a 23505 retry path (signals.server.ts:306-326). A batch of 50 reports per-signal results with 207 Partial Content.

5. **Security baseline is solid.** Constant-time `safeEqual` on bearer keys, SHA-256 fingerprints for diagnostics (not secrets), `escapeLikePattern` for ILIKE safety, bounded string lengths on public inputs (`recordBridgeHit` slices to 200/120 chars).

6. **Accessibility is intentional.** ARIA tablist with arrow-key navigation, `aria-selected`, single-tab-stop pattern (only active tab has `tabIndex=0`), `role="status"` for loading states, `prefers-reduced-motion` everywhere.

### 3.2 Issues & Opportunities (phased)

---

## Phase 1 — Critical / Structural (fix now)

### P1.1: `safeEqual` is triple-copied — consolidate to one module

**Severity:** Maintenance debt, not a bug.

**Where:**
- `lib/bot/telegram.server.ts:95` — exported, used by `entitlements.server.ts`, `member.server.ts`, `stripe.server.ts`
- `routes/api/public/ezyai/signals.ts:65` — local copy inside the route handler file
- `lib/telegram-login.server.ts:54` — local (non-exported) copy

**Why it matters:** Three copies means a security fix touches three files, and a reader can't tell which is canonical. The route-local copy in `signals.ts` shadows the shared one — a future contributor might "improve" it without realizing the entitlement path uses a different version.

**Fix:** Extract to `lib/secure-compare.ts` (or `lib/crypto/safe-equal.ts`), export from there, update all three import sites. One `safeEqual`, one place to audit.

### P1.2: No test coverage for the bridge route handlers

**Severity:** High — this is the integration point the bot depends on.

**Where:** The route files at `src/routes/api/public/ezyai/signals.ts` and `src/routes/api/public/ezyai/entitlements.ts` have **zero unit tests**. The only test that touches the route is `ezyai-board.test.ts:46-53`, which string-slices the source to assert `guard(request)` is called before `diagnose` — a text-based assertion, not a behavioral test.

**Why it matters:** The bridge is the attack surface (public POST endpoint with up to 50-signal batches). Key behaviors are untested:
- 207 Partial Content when some signals in a batch fail
- 200 when all succeed, 400 when all fail
- Quote-trimming in `normalise()` (e.g. `"mykey"` → `mykey`)
- 503 when neither env var is set
- 401 with fingerprint diagnostics on wrong key
- Batch size limit rejection (>50)
- Idempotency: retrying the same `external_id` doesn't duplicate

**Fix:** Add `src/routes/api/public/ezyai/__tests__/signals.test.ts` with mocked `@/integrations/supabase/client.server` and `pushSignal`. Test the guard/normalise/batch logic by feeding mock requests. Use the same `@vitest/spy` + `@ngneat/fake-in-blanket` pattern or a manual `spy` module.

### P1.3: No test coverage for `entitlements.server.ts` claim logic

**Severity:** High — financial entitlement correctness.

**Where:** `src/lib/ezyai/entitlements.server.ts` has no tests. The idempotency window on `claimEntitlement` (it `.is("claimed_at", null)` so a retry can't double-claim) is untested. The collision-retry loop in `recordEzyAiEntitlement` (the `for (let attempt = 0; ; attempt++)` with 23505 handling, signals.server.ts:82-118) is untested.

**Fix:** Add `src/lib/ezyai/__tests__/entitlements.test.ts` with a mocked Supabase client. At minimum:
- `claimEntitlement` on an already-claimed row returns null
- `recordEzyAiEntitlement` retries on 23505 unique violation
- `findEntitlementByCode` rejects malformed codes

### P1.4: `normalise()` in signals.ts drops only one layer of surrounding quotes

**Severity:** Low — edge case, but documented as "drop one matched pair."

**Where:** `routes/api/public/ezyai/signals.ts:33-39`

**Issue:** If a key is pasted as `""mykey""`, only the outer pair is stripped, leaving `"mykey"` — which will still fail `safeEqual`. The function handles the common case (copy-paste from a quoted env field) but doesn't loop.

**Fix:** Either document it as "one pair only by design" or loop the trim. One line change.

### P1.5: CSS `color-mix()` with no fallback for older browsers

**Severity:** Medium — Firefox < 113 doesn't support `color-mix()`.

**Where:** Throughout `src/styles.css` (lines 626, 627, 663, 685, 725, 748, 763, etc.)

**Issue:** `color-mix(in srgb, var(--flag) 45%, transparent)` is used for the signal flag borders, rail gradients, score ring tracks. Firefox 112 and below will render these as transparent (no color at all).

**Fix:** Add a fallback `background-color` before each `color-mix` call, or a `@supports (color: color-mix(in srgb, red, blue))` feature query. Low-effort, prevents a broken-looking board on older Firefox.

---

## Phase 2 — UX / Performance / Polish (next iteration)

### P2.1: History tab loads all 200 signals eagerly

**Severity:** Performance — only matters when the dataset grows.

**Where:** `signals.functions.ts:38-41` — `getEzyAiHistory` calls `listClosedSignals(limit = 200)` and then `summarisePerformance`. The full 200-signal array is sent to the client even though `PerformancePanel` only renders summary numbers + the last ~15 results.

**Why it matters now:** 200 records × ~30 fields = ~6000 numbers per load, every 60s refetch. Small today, but the closed-trade set will grow linearly with the bot's uptime.

**Fix:** Either (a) split: `getEzyAiPerformance()` returns only `summarisePerformance` + recent N signals, `getEzyAiHistory()` returns the paginated list; or (b) add cursor-based pagination to `listClosedSignals`. Option (a) is simplest and matches the panel's actual needs.

### P2.2: No "copy external_id / share" affordance on live cards

**Severity:** UX gap.

**Where:** `components/ezyai/SignalCard.tsx` — the card shows symbol, direction, setup, entry zone, SL, TP2, RR, score, live R. But `signal.entryMid`, `signal.lastPrice`, `signal.resultR` are all displayed, while `signal.note` (if present) renders as a paragraph — there's no way to copy the `external_id` for debugging or sharing.

**Trending-repo benchmark:** OctoBot renders a "copy signal" button on every card that puts the JSON payload on the clipboard. The crypto-signal-board repo does similar in a TEE context.

**Fix:** Add a small clipboard icon on each `SignalCard` that copies `JSON.stringify({ external_id, ...relevant fields })` — useful for the bot operator and for PRO users who want to reference a specific call.

### P2.3: `progressPercent` returns `null` when levels are missing — card shows a grey idle bar

**Severity:** Minor polish.

**Where:** `signals.ts:107-118` and `SignalCard.tsx:59-94` (Rail component)

**Issue:** When `stopPrice` or `tp1`/`tp2` is null (e.g. a watch alert that hasn't set levels yet), `progressPercent` returns null and the rail renders `.signal-rail__idle` (a grey animated bar). This is intentional and documented, but the idle state could be more informative — e.g. "Waiting for entry/stop levels" text on the bar.

**Fix:** When `travelled == null` and `signal.status === "pending"`, overlay a small text label on the idle rail.

### P2.4: Score ring animation runs on first paint for every card simultaneously

**Severity:** Minor jank.

**Where:** `SignalCard.tsx:66-71` — `useEffect` triggers `setDrawn(true)` via `requestAnimationFrame` on mount. `useCountUp(score, 900)` also runs on mount. On a board of 10 cards, all 10 score rings animate at the same time because they share the same `requestAnimationFrame`.

**Trending-repo benchmark:** Trading dashboard repos use staggered `animationDelay` (like the card-level one at SignalCard.tsx:139, which staggers by `index * 60ms`) but the inner animations don't inherit the delay.

**Fix:** Pass the `index` through to `ScoreRing` and `Rail` and apply a proportional `transitionDelay` or `animationDelay`.

### P2.5: Malay route is a full duplicate (`src/routes/ms/ezyai.tsx`)

**Severity:** DRY debt.

**Where:** `src/routes/ms/ezyai.tsx` — a 47-line near-copy of the English `src/routes/ezyai.tsx`. The only differences: `beforeLoad` redirects to `/ms` instead of `/`, the `localizedHead` call passes `locale: "ms"` with translated metadata, and `component` is the same `EzyAiPage`.

**Trending-repo benchmark:** Most i18n React codebases use a single `[lang]/ezyai.tsx` wildcard route or a `lang` loader that swaps `translations[lang]`.

**Fix:** If the project moves to a single wildcard route, the ~30 lines of `EzyAiPage` (currently duplicated) collapse to one. This is a project-level routing decision — flag it but don't refactor in isolation.

### P2.6: No `aria-live` region for board updates

**Severity:** Accessibility gap.

**Where:** `src/routes/ezyai.tsx:229-270` — the live signals tab polls every 60s via `useQuery({ refetchInterval: 60_000 })`. But when the board updates, there's no `aria-live` announcement. A screen reader user has no idea the board changed unless they navigate through the cards.

**Fix:** Add an `aria-live="polite"` region that announces "Updated {n} signals" whenever `board.data?.signals` changes length. The `useCountUp` already handles the visual; this covers the auditory channel.

### P2.7: `LiveSampleSignal` on the home page isn't coordinated with the live board

**Severity:** UX inconsistency.

**Where:** `src/components/landing/LiveSampleSignal.tsx` renders a demo price feed on the home page. The live `/ezyai` board also shows real-time prices. If the board is visible (`EZYAI_BOARD_VISIBLE`), the home page sample is somewhat redundant — and if the bot is down, both show stale data without coordination.

**Fix:** If `EZYAI_BOARD_VISIBLE`, replace the `LiveSampleSignal` on the home page with a "see live" button instead. Or, if the sample is kept for visitors who haven't scrolled to the board, add a note that the real board has the current data.

---

## Phase 3 — Future Enhancements / Research

### P3.1: WebSocket or SSE for live updates instead of 60s polling

**Severity:** Performance optimization for scale.

**Where:** `src/routes/ezyai.tsx:146-155` — `refetchInterval: 60_000` polls the server function every minute.

**Trending-repo benchmark:** All three repos (OctoBot, tradeclaw, crypto-signal-board) push updates via WebSocket or Server-Sent Events. Polling every 60s means a trade can close and the card still shows "running" for up to a minute.

**Options:**
- **TanStack Query `websocket` connector** — if the Supabase project has Realtime enabled, `supabaseAdmin` can subscribe to `ezyai_signals` changes. But the site currently uses the admin client (server-side only), not a public anon key.
- **A lightweight SSE endpoint** that broadcasts `POST /api/public/ezyai/signals` pushes to connected clients. The route handler could call `res.write(...)` after each successful `pushSignal`.
- **Keep polling but add a `/api/public/ezyai/last-update` endpoint** that returns the max `updated_at` — if it hasn't changed, skip the JSON fetch entirely. This is the lowest-lift option and still cuts bandwidth.

### P3.2: Performance panel could show a P&L breakdown, not just R-multiples

**Severity:** Feature gap — depends on what the bot exposes.

**Where:** `PerformancePanel.tsx` — currently shows win rate, total R, avg R, best/worst R, streak, curve, per-symbol breakdown. All in R-multiples (reward/risk ratio), which is correct for a per-trade view.

**Trending-repo benchmark:** tradeclaw's outcome ledger shows monetary P&L alongside R. crypto-signal-board shows dollar gain/loss per signal.

**Constraint:** The `EzyAiSignal` type has no `position_size` or `entry_price` that would let the site compute dollar P&L independently. The bot would need to push `entry_fill` × `size` in the payload. `entry_fill` already exists on the type (signals.ts:75) but `resultPips` and `resultR` are the only realised outcomes.

**Fix (if bot supports it):** Extend `EzyAiSignal` with `positionSize` and `entryFill` (already nullable), then add a toggle in the panel: "show in R" vs "show in $". The conversion is `resultR × (stopPrice → entryFill distance) × positionSize`, which the bot already knows.

### P3.3: Test the CSS `prefers-reduced-motion` coverage more rigorously

**Severity:** Test gap.

**Where:** `src/styles.css:382-389` disables all animations globally. But the `.signal-flag[data-pulse]`, `.signal-rail__fill[data-live="true"]::after`, and `.score-ring` transitions are only suppressed in the signal-specific media query at line 778-789. There's no test that asserts the reduced-motion CSS is actually present.

**Fix:** Add a test that reads `styles.css` and asserts `.signal-card`, `.signal-rail__fill`, and `.score-ring` all have `animation: none` or `transition: none` inside `@media (prefers-reduced-motion: reduce)`. Or use a tool like `css-media-query-tests` (doesn't exist yet — this is a pattern to establish).

### P3.4: Type-driven i18n consistency check

**Severity:** Test debt that grows with the key set.

**Where:** `src/lib/translations.ts:3705` — `export type TranslationKey = keyof typeof translations.en`. The `ezyai-board.test.ts:74-96` test checks that `ezyai_sig_desc` mentions "watch" and `ezyai_sig_empty` doesn't mention "autopilot" — but only in English. There's no assertion that all 6 locales carry the full key set.

**Trending-repo benchmark:** bennycode/trading-signals uses a `LocaleStrings` interface that TypeScript enforces — adding a key to `en` and forgetting `ms` is a compile error.

**Fix:** Add a test that iterates `Object.keys(translations.en)` and asserts each key exists in all 6 locale blocks with a non-empty value. Would catch "forgot to translate" drift automatically.

### P3.5: Reference client could be a living doc

**Severity:** Documentation opportunity.

**Where:** `src/lib/ezyai/assets/ezyai_signal_client.py` — a Python reference implementation of the signal bridge POST. This is already a great pattern (the repo ships its own client SDK in a second language). 

**Trending-repo benchmark:** Drakkar-Software/OctoBot ships 5+ client libraries (Python, Node, Go, Rust, C#). tradeclaw ships a TypeScript SDK with typed payloads.

**Fix:** Promote the reference client to a proper `docs/` subdirectory, add a test that validates it against the actual Supabase schema, and add a README section: "How a signal reaches the board" with the three push shapes (open/tick/close).

---

## 4. Recommendation Summary

| Phase | Priority | Fix | Effort |
|-------|----------|-----|--------|
| **1** | P1.1 | Consolidate `safeEqual` into one exported module | 15 min |
| **1** | P1.2 | Add route-handler tests for signals bridge (mock Supabase) | 2–3 hrs |
| **1** | P1.3 | Add tests for `claimEntitlement` idempotency + 23505 retry | 1–2 hrs |
| **1** | P1.4 | `normalise()` — strip multiple quote layers or document intent | 5 min |
| **1** | P1.5 | Add `color-mix()` fallbacks for Firefox < 113 | 15 min |
| **2** | P2.1 | Split history fetch: performance summary vs. paginated results | 1 hr |
| **2** | P2.2 | Add clipboard/share button on SignalCard | 30 min |
| **2** | P2.3 | Label pending rails when levels are missing | 20 min |
| **2** | P2.4 | Stagger score-ring and rail animations across cards | 20 min |
| **2** | P2.5 | (Project-level) Consolidate `ms/ezyai.tsx` into wildcard route | TBD |
| **2** | P2.6 | `aria-live` announcement on board update | 30 min |
| **2** | P2.7 | Coordinate home-page sample with live board visibility | 30 min |
| **3** | P3.1 | SSE revision channel + revision poll underneath | done |
| **3** | P3.2 | P&L breakdown (if bot pushes position size) | depends on bot |
| **3** | P3.3 | Test CSS `prefers-reduced-motion` coverage | 15 min |
| **3** | P3.4 | Type-check i18n key completeness across 6 locales | 30 min |
| **3** | P3.5 | Promote reference client to living docs | 1 hr |

---

## 5. Trending-Repo Benchmarks

| Pattern | EzyAI site does it? | Best-in-class example |
|---------|---------------------|----------------------|
| Bot-only write model | ✅ Yes (mirrors EzyAI bot) | OctoBot: strategy registry is the writer; UI is read-only |
| Track-record honesty window | ✅ Yes (since 2026-10-25) | tradeclaw: all results have a verifiable "closed_at" timestamp |
| Dedup logic is pure & tested | ✅ Yes (7 unit tests) | tradeclaw: outcome ledger dedups by signal_id hash |
| Bearer-key auth with fingerprint diagnostics | ✅ Yes | crypto-signal-board: TEE attestation instead |
| Partial-batch (207) reporting | ✅ Yes (max 50) | OctoBot: per-signal error reporting on bulk import |
| `prefers-reduced-motion` everywhere | ✅ Yes | — most trading UIs ignore this entirely |
| ARIA tablist with keyboard nav | ✅ Yes | — rare in trading dashboards |
| `safeEqual` in one place | ❌ No — triple-copied | bennycode/trading-signals: single `consts.ts` for crypto fns |
| Route-handler integration tests | ❌ No | OctoBot: full pytest suite on API endpoints |
| i18n key completeness enforced | ❌ No (manual) | bennycode/trading-signals: `LocaleStrings` TS interface |
| SSE/WS live updates | ✅ Yes — SSE revision channel, poll as fallback | tradeclaw: WebSocket stream with backpressure |
| Reference client in multiple languages | ✅ Python only | OctoBot: Python + JS + Go + Rust + C# |
---

## 6. Implementation status (26 Oct 2026)

All tasks implemented except the two that are blocked by design decisions:

- **P2.5 (wildcard route)** — not done here. `ms/ezyai.tsx` is already a
  25-line thin wrapper that re-uses `EzyAiPage`; the remaining duplication is
  the `localizedHead` metadata, which is per-locale on purpose. Collapsing
  every `ms/*` route into one `[lang]` wildcard is a project-wide routing
  decision, not an EzyAI one — flagged for a dedicated change.
- **P3.2 (P&L breakdown)** — blocked on the bot: `EzyAiSignal` has no
  `position_size`, so the site cannot compute dollar P&L from what it is
  told. Revisit when the bot pushes size.

Delivered: P1.1–P1.5, P2.1–P2.4, P2.6–P2.7, P3.1 (revision-stamp poll),
P3.3–P3.5. See `docs/ezyai-signal-bridge.md` for the P3.5 living doc.

**P3.1 (live updates)** — `GET /api/public/ezyai/stream` streams the board's
revision stamp over server-sent events. Two paths feed it: the bridge nudges
every open stream in the same server process the moment a POST is accepted,
and the stream re-reads the revision every 5s so a push handled by another
process still lands within ~5s. The page writes the stamp into the same query
its 30s poll owns, so the board refetches itself; the poll stays as the
fallback for a client whose stream never connects. The stream carries no
signal data and needs no authentication — it is a doorbell, not a channel.
Tests: `lib/ezyai/__tests__/board-events.test.ts` (bus),
`routes/api/public/ezyai/__tests__/stream-route.test.ts` (frames, dedupe,
tick, cleanup) and the publish case in `signals-route.test.ts`.
