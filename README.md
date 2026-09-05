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
  Stripe needs one Price per SKU with `lookup_key` = SKU (sandbox + live).
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

## Deployment

Changes are pushed to `main`, built by Lovable Cloud, and published via
`deploy_project`. There is no separate staging environment — verify
locally (`bun run dev` + a manual pass, or Playwright against
`127.0.0.1`) before pushing.
