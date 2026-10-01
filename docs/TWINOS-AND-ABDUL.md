# TwinOS and ABDUL: how they relate to this site

*Reference note, 2026-10-01. Kept here so future work on printezy.money knows what sits next to it.*

## What TwinOS is
TwinOS is EzyMap's operations system: one database and one set of rules that run the Telegram channel desk (drafts, approvals, scheduling, result replies), cross-posting to Instagram, Facebook and Threads (TikTok, YouTube and X by publish kit), Telegram tracking, moderation, research briefs and the Friday scoreboard. Repo: https://github.com/printezy247/TwinOS-helper-system (master plan in `UPGRADE-PLAN.md`).

It runs on its **own Lovable project and its own Supabase project**, separate from this site's. TwinOS never writes to this site's database.

## What ABDUL is
ABDUL is Jack's personal assistant that runs on his Linux PC (repo `printezy247/abdul`, private). In TwinOS it is the desk operator: it drafts posts, runs the weekly batch, schedules non-claim posts, posts result replies from the board, logs and reads. It cannot approve anything with a price, trade, result or offer; that approval is Jack's tap only. ABDUL talks to TwinOS through an MCP server in `TwinOS-helper-system/apps/mcp/`.

## What this site provides to TwinOS (read-only)
- **Ad-click attribution:** `ad_clicks` and the `record_ad_click` RPC, read through a narrow endpoint, never with the service-role key.
- **Public results board:** `ezyai_signals` and the performance maths in `src/lib/ezyai/signals.ts` (strict win rate: break-even excluded). TwinOS result posts and the Friday scorecard reference board rows.
- **EzyAi signal contract:** `src/routes/api/public/ezyai/signals.ts` and `docs/ezyai_signal_client.py` are the model for TwinOS's own ingest function.
- **Disclaimer strings:** the `*_disclaimer` keys in `src/lib/translations.ts` (EN and MS) seed TwinOS's compliance engine.
- **Products:** `src/lib/catalog.ts` seeds TwinOS's `products` table. When prices change, change them here first and re-seed TwinOS.

## What TwinOS will provide back (later phases)
- A `v_results_board` view the site could read instead of computing its own.
- Attribution reports joining site sessions → bot starts → channel joins → payments.

## Rules that apply on both sides
- Language code for Malay is `ms`.
- Nothing publishes with a price, level, result, offer or testimonial without Jack's explicit approval.
- Every result post carries the past-performance line; every map and signal carries a risk line; IB commission is disclosed.
- Secrets live in the keyring or the platform's secret store, never in repos.

## Contacts between the systems
| From | To | How |
|---|---|---|
| EzyAi (Fly.io) | this site and TwinOS | signal push, idempotent on `external_id` |
| @EzyRegisterBot | TwinOS | `/start` tags and subscriptions, read-only |
| TwinOS ops bot | Telegram channel and Desk group | Bot API, post/edit/delete only |
| ABDUL | TwinOS | MCP tools, scoped key, no approve tool |
