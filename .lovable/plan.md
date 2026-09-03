# Fix every payment path + real accounts for buyers

## Answering the question: is there a better way than typing a Telegram username?

Yes — and your instinct about a login flow is the right one. Typing a handle into a box before paying is the weakest possible link: a typo, a display name instead of a username, or no username set at all and the purchase can never be matched to a person. Handles can also be changed or impersonated, and there's no email on file if delivery fails.

**The plan: buyers get a real account.**

- Sign up / sign in with email + password or Google (one click).
- Purchases are attached to the signed-in account, not to a typed string.
- After the first purchase, the buyer links Telegram once via a one-time code — the bot binds their real Telegram account. No typing handles ever again.
- Guest checkout still works (Stripe collects a verified email, and we email a claim code), so nobody is forced to register before paying — but the account is offered right after and links the purchase automatically.

This gives you: verified identity, a full purchase history per customer, activity tracking, recoverable delivery, and a clean approvals view instead of guessing at handles.

## What gets built

### 1. Accounts and auth
- `/auth` page: email + password and Google sign-in, plus password reset.
- Signed-in state visible in the header (account menu + sign out) on every page.
- `profiles` table for name/avatar/linked Telegram.

### 2. Purchases tied to the account
- Every checkout carries the signed-in user (or the Stripe-verified email for guests).
- `site_purchases` records `user_id`, `email`, and a one-time `claim_code`; the typed handle field goes away.
- Guests who later register with the same email have their past purchases attached automatically.

### 3. Telegram linking done properly
- Success page shows a "Connect Telegram" button that opens EzyRegisterBot with the code pre-filled.
- The bot binds the real Telegram account to the purchase, grants access, and notifies Sarah.
- Buyers who never link stay visible to support and can be resolved by email.

### 4. `/my-account` — the customer's home
Purchase history with status, download/access links, Telegram connection state, and a re-send access button.

### 5. Every buy button now takes card payments
- **Pricing cards** — "Enroll Now" opens Stripe checkout inline for that tier (`signal_beginner`, `signal_pro`, `signal_premium`, `signal_elite`). "Get Free Access" (Vantage) stays as is.
- **Macro & Crypto** — the Full Macro Desk card gets **Pay with card** as the primary action and keeps **Subscribe via Telegram** as the secondary; the four Crypto Desk add-ons get real Buy buttons instead of "Check out price".
- **Indicators** — the overlapping username box and Buy button are removed; each plan row becomes a clean price + Buy layout that no longer spills outside the card, tidy on tablet and mobile.
- One shared Buy component everywhere, so the experience is identical on every page.

### 6. Activity tracking
Page views, checkout starts, completed purchases and ebook/PDF opens recorded against the account when signed in, so you can see what each customer actually does.

## Technical notes

- Lovable Cloud auth: email/password + Google provider configured in the same change. Buyer-facing pages stay public; `/my-account` sits behind the auth gate.
- Migration: `profiles`, `site_purchases.user_id`, `claim_code` (unique), `claimed_by_telegram_id`; RLS so a user reads only their own rows, plus GRANTs.
- `createCheckout` drops the required `telegramUsername` input, passes `client_reference_id`/metadata with the user id, and lets Stripe collect the email. The claim code is minted when the webhook records the paid purchase.
- Telegram webhook gains `/start <code>` handling; the existing handle-based claim stays as a fallback for rows already in the database.
- Confirmation email with the claim code sent on the paid webhook.
- Only sandbox Stripe keys are configured today, so real card payments still require go-live in the payments dashboard.

## Sequencing
Auth + account-linked purchases and the three broken buy surfaces ship together, since they share the same Buy component and checkout function. `/my-account` and activity tracking follow immediately after in the same pass.
