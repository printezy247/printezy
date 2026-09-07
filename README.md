# EzyMap ALGO

Marketing site, checkout, and member tooling for EzyMap ALGO — a trading
signals service delivered over Telegram, built with guest-friendly Stripe
checkout, a Supabase backend, and a companion Telegram bot ecosystem.

Live at **[printezy.lovable.app](https://printezy.lovable.app)**, built and
published through [Lovable Cloud](https://lovable.dev).

## Tech stack

- **[TanStack Start](https://tanstack.com/start)** (React 19) — file-based
  routing, server functions, SSR
- **[Supabase](https://supabase.com)** — Postgres, Auth, and the tables
  behind leads, checkout, ebook claims, referrals, and analytics
- **[Stripe](https://stripe.com)** — checkout, via Lovable's connector
  gateway (no raw secret keys committed)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives) — UI
- **Framer Motion** — page/section motion, respects
  `prefers-reduced-motion`
- **bun** — the project's real package manager (`bun.lock`); `npm` works
  for local diagnostics but its lockfile should never be committed

## Getting started

```bash
bun install
bun run dev      # vite dev — http://localhost:8080
bun run build    # production build
bun run lint     # eslint
bun run format   # prettier --write .
```

Copy `.env.development` and the Supabase/Stripe values in `.env` to a
local `.env` if you need to run against your own backend — in production
these are injected by Lovable Cloud at deploy time, not read from a
committed file.

## Project structure

```
src/
  routes/                 File-based routes (TanStack Start) — see
                           src/routes/README.md for routing conventions.
    index.tsx              Landing page (composes src/components/landing/*)
    macro.tsx               Macro & Crypto desk
    ebooks.$slug.tsx         Standalone ebook detail page
    pricing.tsx, faq.tsx, indicators.tsx, free-channel.tsx, ...
    auth.tsx                 Sign in (Google or email magic link, Supabase Auth)
    dashboard.tsx            Signed-in account page: purchases, ebooks, referral, profile
    account.tsx              Telegram member portal (bot-issued 7-day links, handle + code)
    _authenticated/          Admin-only routes (ads dashboard, site analytics)
  components/
    landing/                 Landing.tsx (Nav, Hero, Pricing, FAQ, Footer, …)
                               and Tools.tsx (TradingView/MT5 product cards)
    EnrollModal.tsx, EbookClaimModal.tsx, EbookDetailsModal.tsx,
    SupportChat.tsx, StickyBuyBar.tsx, ...
  lib/
    *.functions.ts           TanStack server functions (leads, checkout,
                               ebook claims, referrals, support chat, ads)
    bot/                      Telegram bot server logic (menu, enrollment,
                               purchases) — shared with the site's webhook
    catalog.ts                Client-safe product catalogue (SKUs, prices)
    i18n.tsx, translations.ts EN/MS/ZH localization (client-only, toggled
                               in the nav, persisted to localStorage)
    rate-limit.server.ts      Fixed-window rate limiter (Supabase-backed)
supabase/
  migrations/                 SQL migrations — run manually in Supabase's
                               SQL editor (no CI migration runner)
```

## Notable features

- **Guest checkout** — no account required to buy; an account is created
  from the Stripe webhook after payment, with an optional magic-link
  sign-in offered afterward.
- **Sign in / My account** — the header, mobile menu and footer carry a
  Sign in link (`/auth`: Google or email magic link, no passwords) that
  turns into My account (`/dashboard`) once a Supabase session exists.
  The dashboard lists the account's `site_purchases`, ebook claims with
  download buttons, the referral link and a small profile form. Supabase
  Auth → URL configuration must allow `https://printezy.money/**` (and the
  Lovable preview hosts) as redirect URLs, because sign-in returns deep
  links such as `/ebooks/<slug>?claim=1`.
  The name on the Google consent screen comes from the OAuth client, not
  from this repo. To show "EzyMap ALGO" instead of the raw
  `<project-ref>.supabase.co` host, own the client: verify `printezy.money`
  in Google Search Console, then in Google Cloud Console → Google Auth
  Platform set Branding (app name, logo, home/privacy/terms URLs,
  `printezy.money` as an authorized domain), set Audience to External and
  publish, and create a Web application client whose redirect URI is
  `https://<project-ref>.supabase.co/auth/v1/callback`. Paste that client id
  and secret into Lovable Cloud → Auth → Google. Sign-in only needs the
  non-sensitive `openid`, `userinfo.email` and `userinfo.profile` scopes, so
  no verification review is required — uploading a logo does trigger one,
  though sign-in keeps working while it is pending.
- **Gated ebooks** — the PDFs live in the private `ebooks` storage bucket
  (object key `<slug>.pdf`, see `supabase/migrations/20260906090000_*`),
  not under `public/`. `getEbookDownloadUrl` hands a signed-in user with an
  approved `ebook_claims` row a one-hour signed URL; nothing else can read
  the bucket. Uploading a new PDF = drop it into the bucket in Lovable Cloud
  → Storage and set `file` on the `EBOOK_PAGES` entry.
  Most slugs approve themselves on claim. `mapping-like-a-pro` is a real
  approval gate: the visitor submits full name, Telegram handle and Vantage
  account number, the row is saved `pending`, and `notifyVantageClaim`
  (`src/lib/bot/ebook-claims.server.ts`) sends Sarah an Approve button.
  Only her chat may act on the `ebook:approve:<claimId>` callback. The send
  is awaited, never fire-and-forget — the worker is torn down as soon as the
  response is returned, so an un-awaited notice is silently dropped.
- **Support inbox (`support_config.sarah_chat_id`)** — one numeric Telegram
  chat id is the destination for everything the site sends Sarah: website
  "Ask Sarah" relays, ebook approval requests, trial and purchase requests,
  and referral-conversion notices. `autoRegisterSarah`
  (`src/lib/bot/sarah.server.ts`) writes it the first time she messages the
  bot from `@ezysarah`, then refuses to re-bind, because a released Telegram
  handle could otherwise be re-registered by someone else. Moving the inbox
  therefore means editing that row by hand.
  Get that number wrong and every send fails silently: Telegram rejects the
  chat, the visitor still sees "Sent to Sarah", and nothing surfaces. The
  diagnostic is `support_messages.sarah_message_id` — it is `NULL` on every
  row when the id is wrong, and populated once a send lands. Cross-check the
  value against `bot_users.telegram_id` for `ezysarah`, which the webhook
  writes straight from a real Telegram update and is therefore
  authoritative.
- **Telegram portal links** — every "My account" button the bot sends is a
  fresh 7-day `member_sessions` row (`accountLinkFor`). The permanent
  `enrollments.portal_token` is only a Stripe correlation id and is no
  longer accepted as a credential.
- **Six locales (en/ms/zh/hi/ar/sw)** — switcher in the nav (see
  `src/lib/i18n.tsx`). Every public page has a real Malay URL under `/ms/*`
  (`src/routes/ms/*` re-export the English page component with a Malay
  `head()` from `src/lib/seo.ts`); reciprocal hreflang is emitted per route
  and in `/sitemap.xml`. zh/hi/ar/sw are a client-side preview with no URL
  of their own. `TranslationKey` is derived from the `en` block, so a new
  key must be added to all six blocks in `src/lib/translations.ts`.
  Ebook page copy is localized via the `ms` field on each `EBOOK_PAGES`
  entry (`src/lib/ebooks.ts`); the PDFs and the Macro desk data
  (`src/lib/macro-desk.ts`) stay English.
- **EzyAI PRO checkout** — `ezyai_pro_{1m,6m,1y}` SKUs go through the same
  guest Stripe checkout as every other product. The webhook records the
  `site_purchases` row, then writes an `ezyai_entitlements` row keyed on
  the Telegram handle typed at checkout instead of granting an EzyRegister
  enrollment. `@ezytradeai_bot` pulls unclaimed rows for a handle from
  `GET/POST /api/public/ezyai/entitlements` (bearer key
  `EZYAI_ENTITLEMENT_KEY`, same value as the bot's `EZYAI_SITE_KEY`) and
  activates PRO itself. See `src/lib/ezyai/entitlements.server.ts`.
  Every EzyAI checkout also mints a redeem code (`EZY-XXXX-XXXX`,
  `src/lib/ezyai/redeem-code.ts`) stored on the Stripe session and in the
  payment description, so it shows on the success page, the Stripe receipt
  and the My account page. A buyer whose handle didn't match sends
  `/redeem <code>` to the bot, which looks the row up with
  `GET /api/public/ezyai/entitlements?code=<code>`.
  Stripe needs one Price per SKU with `lookup_key` = SKU (sandbox + live).
- **Macro desk data** — the economic calendar on `/macro` is read from
  ForexFactory's weekly feed (`src/lib/macro-calendar.functions.ts`). The
  central bank rates, recession odds, decision dates and the two trend
  sparklines come from the MacroTrader bot's `GET /api/desk`
  (`src/lib/macro-live.functions.ts`; env `MACRO_BOT_URL` +
  `MACRO_BOT_KEY`, the latter equal to the bot's `SITE_API_KEY`), so the
  site and the Telegram bot always show the same numbers. Both are cached
  in `macro_calendar_cache` and fall back to the last good copy; with the
  bridge unset the cards show the seeded copy with a "sample data" note.
- **Rate limiting** — `checkCheckout`, `saveLead`, and the support chat
  endpoints are protected by a Supabase-backed fixed-window limiter that
  fails open (never blocks a legitimate purchase or message on a limiter
  outage).
- **SECURITY DEFINER functions** — every function of this kind ships with
  an explicit `REVOKE ... FROM PUBLIC, anon, authenticated` and a `GRANT`
  only to the role that calls it (see `supabase/migrations/`).

## Related repos

- **[EzyMap](https://github.com/printezy247/EzyMap)** — the MT5/TradingView
  indicator source, the Telegram bot, and `EzyMapLicenseServer` (the
  separate Xendit-based licensing backend for the MT5 tools). The website
  and the Telegram bot are intentionally separate systems that don't share
  purchase data — a website sale notifies the team over Telegram for
  manual reconciliation against the bot's own product/license system.
- **[EzyAi](https://github.com/tradernonymous/EzyAi)** — the `@ezytradeai_bot`
  Telegram bot (Python): on-demand analysis, live watch alerts, fundamentals
  and autopilot signals, with Free/PRO tiers. PRO is billed two ways: inside
  Telegram (the bot's own Stripe Checkout, Telegram Stars, or USDT with admin
  approval) or by card on `/ezyai` here, delivered through the
  `ezyai_entitlements` bridge described above. The bot keeps its own plan
  state; the website never reads it.

- **[ASAP-TeleBot](https://github.com/printezy247/ASAP-TeleBot)** — the
  button-driven product bot (Python): signal-community tiers, the paid tool
  catalog, USDT/Stripe/Telegram Stars payments and MT5 trial licensing. It
  runs its own admin approvals against `EZYMAP_ADMIN_CHAT_ID`, which is a
  separate setting from this site's `sarah_chat_id`; if the same person
  admins both, the two numbers should match.

## Deployment

Changes are pushed to `main`, built by Lovable Cloud, and published via
`deploy_project`. There is no separate staging environment — verify
locally (`bun run dev` + a manual pass, or Playwright against
`127.0.0.1`) before pushing.

`deploy_project` returns `pending` and does not always land. When the
Lovable editor still reports the project as unpublished, open it and click
Publish → Update, then hard-refresh printezy.money. Note that anything
stored in the database — the support inbox id, entitlement rows, cached
macro payloads — takes effect immediately and needs no publish at all.
