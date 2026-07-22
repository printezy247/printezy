
# PrintEzy Premium Redesign — Phased Plan

This is a large scope (18+ pages, CRM, forms, payments, admin, analytics). Shipping it all in one pass would produce shallow work on every surface. I'm proposing a phased build so each phase lands polished and production-ready before moving to the next. Please confirm the phasing (or reprioritize) and I'll start Phase 1.

## Design direction (applies to all phases)

- **Palette**: black `#050706` / charcoal `#0B0F0D` base, emerald `#00C853` for action, gold `#D4AF37` reserved for premium/partner accents, cream `#F5F7F6` type.
- **Typography**: Inter (body) + Manrope or Geist (display). Large, confident, left-aligned in long-form; centered only in hero moments.
- **Motion**: Framer Motion — subtle fades, parallax, scroll-linked chart state changes (READY → LIVE). Respect `prefers-reduced-motion`.
- **Chrome**: sticky glass nav that compacts on scroll; floating "Get EzyMap Lite" CTA on mobile.
- **Tone**: calm, premium, educational. No hype, no fake urgency, no guaranteed-profit language anywhere.

---

## Phase 1 — Foundation + Homepage (recommended first ship)

Rebuild the current landing as the new PrintEzy home, including all 15 homepage sections in the brief:

1. Cinematic hero (animated headline sequence, chart-in-monitor visual, READY→LIVE scroll transition, three CTAs).
2. Trust bar strip.
3. "Trading should not feel random" — 4 problem cards.
4. Introducing EzyMap — interactive Scalping / Intraday / Swing mode switcher.
5. How EzyMap works — MAP → READY → LIVE → MANAGE workflow.
6. Real workflow demo — before/after chart, video placeholder.
7. Product ladder — Lite / Pro Software $29 / Pro Partner cards with correct disclaimers.
8. Partner Access 6-step journey.
9. Education ecosystem — 4 cards.
10. Ebook library — 3D book mockups (Technical Analysis, Mapping Like a Pro, Small Account "Coming Soon").
11. Jack brand section — faceless silhouette treatment.
12. Transparent results gallery with filter tabs (Gold / BTC / Win / Loss / Invalidated / No Entry) — seeded with placeholder case studies.
13. Telegram community — phone mockup.
14. FAQ accordion (22 questions from brief).
15. Final conversion section.

Plus: sticky nav, mobile floating CTA, premium footer with full risk disclosure, SEO meta per section, analytics events wired to existing `analytics_events` table (button clicks, section views).

Design assets I'll generate: chart-in-monitor hero mockup, before/after chart pair, 3D ebook covers, Jack silhouette, phone-with-Telegram mockup.

## Phase 2 — Product & content pages

Separate routes with Apple-style storytelling:

- `/ezymap` — sticky-chart product page (Gold/BTC, timeframes, modes, READY vs LIVE, alerts, trade card, Lite vs Pro comparison, TradingView install, limitations).
- `/ezymap/lite`, `/ezymap/pro-software`, `/ezymap/pro-partner` — dedicated pages per tier.
- `/education`, `/ebooks`, `/results`, `/about-jack`, `/faq`.

## Phase 3 — Conversion flows + Supabase backend

- `/register` — Vantage partner registration guide (steps, KYC checklist, security warning).
- `/activate` — activation form (name, email, Telegram, Vantage account #, TradingView user, package). Never asks for passwords/OTP/banking.
- `/contact-zarif` — support entry.
- Supabase tables: `leads`, `activations`, `products`, `access_grants`, plus RLS + GRANTs. Consent + source tracking (UTM) captured on every submit.
- Confirmation pages + Telegram deep-link follow-up.

## Phase 4 — Legal + admin

- Legal pages: Risk Disclosure, Terms of Access, Refund Policy, Privacy Policy, Cookie Policy.
- Admin dashboard (auth-gated, role: `admin` via `user_roles` table) showing lead pipeline stages, filters, notes, next-follow-up. Jack + Zarif roles.

## Phase 5 — Payments (only when you confirm provider)

Checkout scaffolding for EzyMap Pro Software ($29 / $69). I will NOT wire a live provider until you confirm which one (HitPay / Xendit / Billplz / Stripe / PayPal) is approved for TradingView-analysis software in your region. USDT stays secondary.

---

## Technical notes

- Stack: existing TanStack Start + Tailwind v4 + Supabase (Lovable Cloud) — no framework changes needed.
- Analytics: extend the existing `analytics_events` table with new event names; no schema change required for Phase 1.
- Every new `public` table in Phase 3+ ships with GRANTs + RLS in the same migration.
- Reduced-motion + keyboard nav + Core Web Vitals budget respected from Phase 1.

---

## What I need from you before starting

1. **Confirm phasing** — start with Phase 1 (homepage) as a standalone ship, or bundle Phase 1+2?
2. **Real assets** — do you have (a) a real EzyMap chart screenshot I can use in the hero/demo, (b) actual dated case-study screenshots for the Results gallery, (c) Jack silhouette photo? If not, I'll generate premium placeholders and mark them for replacement.
3. **Vantage IB link** — the official partner registration URL to wire into "Open Account" CTAs.
4. **Zarif contact** — Telegram username or link for the "Chat With Zarif" / "Contact Zarif" buttons.
5. **Pro Software checkout** — for Phase 1 the "Get Software Access" button can either (a) open a Telegram DM to Zarif, or (b) link to a "coming soon" page until Phase 5. Which do you prefer?

Reply with answers (or just "start Phase 1, use placeholders") and I'll begin.
