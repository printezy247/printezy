# Fix all payment paths + a trustworthy purchase-to-access flow

## The problem with asking for a Telegram username up front

Today every purchase depends on the buyer typing their Telegram handle correctly into a box before paying. That is the weakest link:

- A typo, a display name instead of a username, or no username set at all means the purchase can never be matched to a person.
- Handles can be changed or impersonated — anyone can type someone else's handle.
- The buyer has no proof of purchase if delivery fails; there's no email on file.

**Better approach: email is the identity, a one-time claim code is the key.**

1. Stripe Checkout collects the email itself (verified through the receipt) — no hand-typed field, no typos.
2. After payment we generate a short one-time claim code (e.g. `EZY-7K4Q-2M9X`) tied to that purchase.
3. The success page shows the code with a one-tap "Open EzyRegisterBot" button that pre-fills it (`t.me/EzyRegisterBot?start=CODE`), and the code is also emailed with the receipt.
4. The bot receives the code, binds the real verified Telegram account to the purchase, and grants access instantly.

This means: no handle typing, the buyer is verified by both email and their actual Telegram account, delivery is recoverable (they can re-open the link or ask support with their email), and every purchase has a permanent audit trail. Telegram handle stays optional — captured automatically from the account that claims.

## What gets fixed

### 1. Pricing cards — "Enroll Now" pays on-site
`/pricing` and the landing pricing section currently send buyers to Telegram. Each tier's primary button opens Stripe checkout inline for that tier's SKU (`signal_beginner`, `signal_pro`, `signal_premium`, `signal_elite`). "Get Free Access" (Vantage) stays exactly as it is.

### 2. Macro & Crypto — two clear options
The Full Macro Desk card gets **Pay with card** (Stripe, `macro_full_desk`) as the primary button and keeps **Subscribe via Telegram** as the secondary. The four Crypto Desk add-ons swap "Check out price" for a real Buy button (`macro_addon`, `macro_yield_optimizer`).

### 3. Indicators — fix the broken card layout
The TradingView/MT5 cards have the username box and Buy button overflowing the card and overlapping the price row (visible in the annotation). Rebuilt as a clean price row with the Buy button beneath it, full width, no overlap, tidy on tablet and mobile.

### 4. One consistent buy experience everywhere
A single Buy component used by pricing, macro and indicators: click → Stripe payment form opens inline → pay → success page with claim code. No Telegram username field anywhere before payment.

### 5. Delivery and approval reliability
- Purchases record email + claim code, not just a handle.
- Claiming through the bot grants access and notifies Sarah.
- Unclaimed purchases stay visible so support can resolve them by email.
- Success page shows the code, the bot button, and what to do if Telegram isn't installed.

## Technical notes

- `site_purchases` gains `claim_code` (unique) and `claimed_by_telegram_id`; `telegram_username` becomes optional/derived. Migration includes GRANTs.
- `createCheckout` drops the required `telegramUsername` input, keeps SKU + origin validation, and lets Stripe collect the email; the claim code is generated when the webhook records the paid purchase.
- Telegram webhook handles `/start <code>` → look up unclaimed purchase → stamp `claimed_by_telegram_id`, `granted_at`, upsert `bot_users`, DM access, notify Sarah. Existing handle-based `claimSitePurchases` stays as a fallback for older rows.
- Transactional email with the claim code is sent on the paid webhook.
- `BuyButton` loses the username input and becomes a single button + inline checkout overlay; all call sites updated.
- Currently only sandbox Stripe keys are configured, so live card payments need go-live completed in the payments dashboard.

## Out of scope for this pass
Ebook analytics, `/my-account`, and the free-trial package remain on the list for a follow-up.
