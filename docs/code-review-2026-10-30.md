# Code Review — 30 Oct 2026 (full repo, post-EzyAI review)

Baseline: `typecheck` 0 errors, `lint` 0 errors / 21 warnings, `test` 233/233 pass.
Prior EzyAI review (`ezyai-review-phased-upgrades.md`) verified done except P3.2 (blocked on bot `position_size`).

## Fixed in this pass (Phase 0 + Phase 1 smalls)

| # | File | Fix |
|---|------|-----|
| 0.1 | `checkout.functions.ts:76`, `ebook-claims.functions.ts:152` | `getCatalogItem(...)!` / `getEbook(...)!` → explicit `if (!item) throw` |
| 0.1 | `dashboard.tsx:260` | `p.redeemCode!` → guarded clipboard write |
| 0.1 | `translations.ts:37` | `pending[locale]!` → guarded resolve |
| 0.1 | `Landing.tsx:1406` | `t.openAccountEvent!` → `if` guard |
| 0.2 | `reconciliation.functions.ts` | `createStripeClient` hoisted out of fulfill loop |
| 0.3 | `api/public/ezyai/signals.ts` | `firstId` now reads the found valid entry, not `batch[0]` |
| 0.4 | `ezyai/signals.server.ts:toSignal` | unknown direction/status now `console.error` with row id instead of silent coerce |
| 0.5 | `api/public/payments/webhook.ts` | invalid/inactive `?env=` now logs received vs active env for misconfig diagnosis |
| 0.6 | `bot/fulfillment.server.ts` | null-meta sessions log before legacy activation attempt |
| 1.x | `.gitignore` | `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` ignored (bun-only, closes README gap) |
| 1.x | `secure-compare.ts` | documented length-early-return as intentional |
| 1.x | `rate-limit.server.ts` | added `checkAuthRateLimit` (failClosed:true) for login/redeem/claim callers |
| 1.x | `Landing.tsx:1979` | JSON-LD `dangerouslySetInnerHTML` annotated as `JSON.stringify` output |

## Still open (from this review)

- [x] Audit all `checkRateLimit` callers: auth paths → `checkAuthRateLimit`. Done 2026-11-02: `member.functions:requestLoginCode`, `telegram-login.functions:allowTelegramLogin`, `auth-rate-limit.functions:checkAuthAttempt` now use `checkAuthRateLimit`.
- [x] `clientIp()` trusts `x-forwarded-for` — documented trusted-proxy assumption in `rate-limit.server.ts`; never for auth decisions.
- [x] Telegram webhook 200-on-error: catch now also writes `recordSarahSendFailure("telegram webhook", ...)` best-effort, still returns 200.
- [x] 21 `react-refresh/only-export-components` warnings: scoped off in `eslint.config.js` for `src/routes/**`, `src/components/ui/*`, `src/lib/i18n.tsx` with rationale. Lint is now 0 errors / 0 warnings.
- [x] `console.*` hygiene: gated the single client log (`EnrollModal.tsx` behind `import.meta.env.DEV`); server `console.error` retained as correct.
- [x] CI note stale — already fixed in `docs/SEO-KNOWN-GAPS.md` (documents `test.yml` + `bun run check`).
- [x] i18n reply-book completeness test: added `src/lib/bot/__tests__/reply-book-completeness.test.ts` (29 entries × 6 langs, button shape, nav labels). 6/6 pass; suite is now 239 tests.

## Trending-repo ideas applied / proposed

See main chat summary: freqtrade (dry-run posture), hummingbot (key storage separation), jesse (chart+history detail), OctoBot (bulk-import per-signal errors — already your 207), TanStack query/router/pacer (board caching, validated `?tab=`, client throttle only), supabase/realtime (WS has no delivery guarantee — keep Postgres truth + revision stamp), pr-agent (AI PR review for schema/auth/webhook diffs), amirphl bot (persist `source_channel_id`+`source_message_id`, confidence/age gates), boxyhq (audit log pattern).

Proposed next: `source_message_id` unique constraint for DB-level dedup; `/ezyai/$externalId` detail route; redeem-code hash + audit log; JS client snippet alongside Python.
