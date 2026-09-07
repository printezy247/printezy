# 📈 EzyMap ALGO

> Marketing site, checkout, and member tooling for EzyMap ALGO — a trading signals
> service delivered over Telegram, built with guest-friendly Stripe checkout, a
> Supabase backend, and a companion Telegram bot ecosystem.

|                 |                                                                         |
| --------------- | ----------------------------------------------------------------------- |
| 🌐 **Live**     | [printezy.money](https://printezy.money)                                |
| ☁️ **Hosting**  | [Lovable Cloud](https://lovable.dev) — builds and publishes from `main` |
| 🗄️ **Backend**  | Supabase (Postgres + Auth + Storage)                                    |
| 💳 **Payments** | Stripe, through Lovable's connector gateway                             |
| 💬 **Bots**     | `@EzyRegisterBot`, `@ezytradeai_bot`, ASAP-TeleBot, MacroTrader         |

---

## 🧱 Tech stack

| Piece                                                       | What it does                                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **[TanStack Start](https://tanstack.com/start)** (React 19) | File-based routing, server functions, SSR                                                 |
| **[Supabase](https://supabase.com)**                        | Postgres, Auth, and the tables behind leads, checkout, ebook claims, referrals, analytics |
| **[Stripe](https://stripe.com)**                            | Checkout via Lovable's connector gateway — no raw secret keys committed                   |
| **Tailwind CSS v4** + **shadcn/ui**                         | UI, on Radix primitives                                                                   |
| **Framer Motion**                                           | Page and section motion, respects `prefers-reduced-motion`                                |
| **bun**                                                     | The project's real package manager (`bun.lock`)                                           |

> ⚠️ `npm` works for local diagnostics, but its lockfile must never be committed.

---

## 🚀 Getting started

```bash
bun install

bun run dev      # vite dev — http://localhost:8080
bun run build    # production build
bun run lint     # eslint
bun run format   # prettier --write .
```

Copy `.env.development` and the Supabase/Stripe values in `.env` to a local `.env`
if you need to run against your own backend. In production these are injected by
Lovable Cloud at deploy time, never read from a committed file.

---

## 🗂️ Project structure

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
    i18n.tsx, translations.ts Six-locale localization (client-only, toggled
                               in the nav, persisted to localStorage)
    rate-limit.server.ts      Fixed-window rate limiter (Supabase-backed)
supabase/
  migrations/                 SQL migrations — run manually in Supabase's
                               SQL editor (no CI migration runner)
```

---

## ✨ How it works

### 🛒 Guest checkout

No account required to buy. An account is created from the Stripe webhook after
payment, with an optional magic-link sign-in offered afterward.

---

### 🔐 Sign in and My account

The header, mobile menu and footer carry a Sign in link (`/auth`: Google or email
magic link, no passwords) that turns into My account (`/dashboard`) once a Supabase
session exists. The dashboard lists the account's `site_purchases`, ebook claims
with download buttons, the referral link and a small profile form.

> ⚠️ Supabase Auth → URL configuration must allow `https://printezy.money/**` and
> the Lovable preview hosts as redirect URLs, because sign-in returns deep links
> such as `/ebooks/<slug>?claim=1`.

<details>
<summary>🎨 <b>Making the Google consent screen say "EzyMap ALGO"</b></summary>

<br>

The name on that screen comes from the OAuth client, not from this repo. Without
your own client, Google shows the raw `<project-ref>.supabase.co` host.

1. Verify `printezy.money` in Google Search Console.
2. Google Cloud Console → **Google Auth Platform** → **Branding**: app name, logo,
   home/privacy/terms URLs, and `printezy.money` as an authorized domain.
3. **Audience** → External, then Publish.
4. **Clients** → create a Web application client with redirect URI
   `https://<project-ref>.supabase.co/auth/v1/callback`.
5. Paste that client id and secret into Lovable Cloud → Auth → Google.

Sign-in only needs the non-sensitive `openid`, `userinfo.email` and
`userinfo.profile` scopes, so no verification review is required. Uploading a logo
does trigger one, though sign-in keeps working while it is pending.

</details>

---

### 📘 Gated ebooks

The PDFs live in the private `ebooks` storage bucket (object key `<slug>.pdf`, see
`supabase/migrations/20260906090000_*`), not under `public/`.
`getEbookDownloadUrl` hands a signed-in user with an approved `ebook_claims` row a
one-hour signed URL. Nothing else can read the bucket.

📥 **To add a PDF:** drop it into the bucket in Lovable Cloud → Storage, then set
`file` on the `EBOOK_PAGES` entry.

🚦 **The approval gate.** Most slugs approve themselves on claim.
`mapping-like-a-pro` is a real gate: the visitor submits full name, Telegram handle
and Vantage account number, the row is saved `pending`, and `notifyVantageClaim`
(`src/lib/bot/ebook-claims.server.ts`) sends Sarah an Approve button. Only her chat
may act on the `ebook:approve:<claimId>` callback.

> ⚠️ That send is awaited, never fire-and-forget. The worker is torn down as soon
> as the response is returned, so an un-awaited notice is silently dropped.

---

### 📮 Support inbox

One numeric Telegram chat id, `support_config.sarah_chat_id`, is the destination
for everything the site sends Sarah:

- 💬 website "Ask Sarah" relays
- 📘 ebook approval requests
- 🎁 trial and purchase requests
- 🤝 referral-conversion notices

`autoRegisterSarah` (`src/lib/bot/sarah.server.ts`) writes it the first time she
messages the bot from `@ezysarah`, then refuses to re-bind, because a released
Telegram handle could otherwise be re-registered by someone else. Moving the inbox
therefore means editing that row by hand.

<details>
<summary>🚨 <b>When a send fails</b></summary>

<br>

Get that number wrong and Telegram rejects every send. This used to be invisible:
the visitor still read "Sent to Sarah" and nobody found out until someone went
looking. Three surfaces now report it.

| Surface               | What you see                                                                      |
| --------------------- | --------------------------------------------------------------------------------- |
| 🖥️ Admin dashboard    | `/site-analytics` shows a red **Support inbox is not delivering** card            |
| 👤 Ebook claim screen | The visitor is offered a direct Telegram link instead of "Sarah will review this" |
| 🗄️ Database           | `support_config.sarah_send_health` holds the failing send, timestamp and error    |

`recordSarahSendFailure` writes that row. The next successful send calls
`clearSarahSendFailure`, and the card clears itself.

🔍 **Diagnosing a wrong id.** `support_messages.sarah_message_id` is `NULL` on every
row while the id is wrong, and populated once a send lands. Cross-check the value
against `bot_users.telegram_id` for `ezysarah`, which the webhook writes straight
from a real Telegram update and is therefore authoritative.

</details>

---

### 🔗 Telegram portal links

Every "My account" button the bot sends is a fresh 7-day `member_sessions` row
(`accountLinkFor`). The permanent `enrollments.portal_token` is only a Stripe
correlation id and is no longer accepted as a credential.

---

### 🌍 Six locales

`en` · `ms` · `zh` · `hi` · `ar` · `sw` — switcher in the nav, see
`src/lib/i18n.tsx`.

Every public page has a real Malay URL under `/ms/*` (`src/routes/ms/*` re-export
the English page component with a Malay `head()` from `src/lib/seo.ts`), and
reciprocal hreflang is emitted per route and in `/sitemap.xml`. The other four are
a client-side preview with no URL of their own.

> ⚠️ `TranslationKey` is derived from the `en` block, so a new key must be added to
> all six blocks in `src/lib/translations.ts`.

Ebook page copy is localized via the `ms` field on each `EBOOK_PAGES` entry
(`src/lib/ebooks.ts`). The PDFs and the Macro desk data (`src/lib/macro-desk.ts`)
stay English.

📗 **Trading terms stay in English in every locale.** Traders learn this
vocabulary in English, and translating it makes copy harder to follow, not
easier — so `signal`, `entry`, `stop loss`, `take profit`, `target`, `support`,
`resistance`, `breakout`, `trend`, `scalp`, `intraday`, `swing`, `timeframe`,
`indicator`, `macro`, `bullish`/`bearish`, `hawkish`/`dovish`, `forex`,
`crypto`, `pair`, `drawdown`, `position`, `chart`, `level`, `setup` and `pip`
are left as-is inside the translated sentence. Two things are deliberately
_not_ converted: words that carry a second everyday meaning in that language
(Arabic `دعم` is also customer support, `دخول` is also signing in), and the
`match` arrays in the reply-book layers — those are the phrases a visitor
types in their own language, so translating them would stop the bot
recognising them. Button labels are safe: `localize` keeps the English
entry's keyword and URL and swaps only the visible text.

---

### 🤖 EzyAI PRO checkout

`ezyai_pro_{1m,6m,1y}` SKUs go through the same guest Stripe checkout as every
other product. The webhook records the `site_purchases` row, then writes an
`ezyai_entitlements` row keyed on the Telegram handle typed at checkout instead of
granting an EzyRegister enrollment.

`@ezytradeai_bot` pulls unclaimed rows for a handle from
`GET/POST /api/public/ezyai/entitlements` (bearer key `EZYAI_ENTITLEMENT_KEY`, same
value as the bot's `EZYAI_SITE_KEY`) and activates PRO itself. See
`src/lib/ezyai/entitlements.server.ts`.

🎟️ **Redeem codes.** Every EzyAI checkout also mints one (`EZY-XXXX-XXXX`,
`src/lib/ezyai/redeem-code.ts`) stored on the Stripe session and in the payment
description, so it shows on the success page, the Stripe receipt and My account. A
buyer whose handle didn't match sends `/redeem <code>` to the bot, which looks the
row up with `GET /api/public/ezyai/entitlements?code=<code>`.

> ⚠️ Stripe needs one Price per SKU with `lookup_key` = SKU, in both sandbox and
> live.

---

### 📊 Macro desk data

The economic calendar on `/macro` is read from ForexFactory's weekly feed
(`src/lib/macro-calendar.functions.ts`).

Central bank rates, recession odds, decision dates and the two trend sparklines
come from the MacroTrader bot's `GET /api/desk`
(`src/lib/macro-live.functions.ts`; env `MACRO_BOT_URL` + `MACRO_BOT_KEY`, the
latter equal to the bot's `SITE_API_KEY`), so the site and the Telegram bot always
show the same numbers.

Both are cached in `macro_calendar_cache` and fall back to the last good copy. With
the bridge unset the cards show the seeded copy with a "sample data" note.

---

### 🛡️ Rate limiting

`checkCheckout`, `saveLead`, and the support chat endpoints are protected by a
Supabase-backed fixed-window limiter that fails open, so a limiter outage never
blocks a legitimate purchase or message.

---

### 🔏 SECURITY DEFINER functions

Every function of this kind ships with an explicit
`REVOKE ... FROM PUBLIC, anon, authenticated` and a `GRANT` only to the role that
calls it. See `supabase/migrations/`.

---

## 🔀 Related repos

### [EzyMap](https://github.com/printezy247/EzyMap)

The MT5/TradingView indicator source, the Telegram bot, and `EzyMapLicenseServer`
(the separate Xendit-based licensing backend for the MT5 tools).

> The website and the Telegram bot are intentionally separate systems that don't
> share purchase data. A website sale notifies the team over Telegram for manual
> reconciliation against the bot's own product/license system.

### [EzyAi](https://github.com/tradernonymous/EzyAi)

The `@ezytradeai_bot` Telegram bot (Python): on-demand analysis, live watch alerts,
fundamentals and autopilot signals, with Free/PRO tiers. PRO is billed two ways —
inside Telegram (the bot's own Stripe Checkout, Telegram Stars, or USDT with admin
approval), or by card on `/ezyai` here, delivered through the `ezyai_entitlements`
bridge above. The bot keeps its own plan state; the website never reads it.

### [ASAP-TeleBot](https://github.com/printezy247/ASAP-TeleBot)

The button-driven product bot (Python): signal-community tiers, the paid tool
catalog, USDT/Stripe/Telegram Stars payments and MT5 trial licensing.

> ⚠️ It runs its own admin approvals against `EZYMAP_ADMIN_CHAT_ID`, a separate
> setting from this site's `sarah_chat_id`. If the same person admins both, the two
> numbers should match.

---

## 🚢 Deployment

Changes are pushed to `main`, built by Lovable Cloud, and published via
`deploy_project`. There is no separate staging environment, so verify locally
(`bun run dev` plus a manual pass, or Playwright against `127.0.0.1`) before
pushing.

> ⚠️ `deploy_project` returns `pending` and does not always land. When the Lovable
> editor still reports the project as unpublished, open it and click
> **Publish → Update**, then hard-refresh printezy.money.

💡 Anything stored in the database — the support inbox id, entitlement rows, cached
macro payloads — takes effect immediately and needs no publish at all.
