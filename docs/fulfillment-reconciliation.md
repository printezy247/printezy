# Fulfillment reconciliation — the sweep for webhooks that never arrived

The Stripe webhook (`/api/public/payments/webhook`) is the primary fulfillment
path. This is the backup for the orders it never saw: a delivery outage, a
secret rotation that broke verification, or a buyer who paid but never opened
the success page (so the early-entitlement path never ran either).

## What it does

`reconcilePurchases` (in `src/lib/reconciliation.functions.ts`, admin-only)
lists recent paid website sessions from Stripe and cross-checks them against
`site_purchases`:

- Dry run (default): reports `{ scanned, missing[] }` — session id, sku and
  amount for every paid session with no purchase row. Nothing is granted.
- `{ fulfill: true }`: grants each missing session through `fulfillSession`
  (in `src/lib/bot/fulfillment.server.ts`) — the exact function the webhook
  calls, and every recorder it reaches is idempotent on `stripe_session_id`,
  so a session the webhook _did_ fulfill is a harmless no-op.

Always dry-run first and read the report before fulfilling.

## Running it

There is no cron wired in this repo — scheduling is a manual step (see below).
To run once, call the server function from an admin session (e.g. a small
admin-panel button or a server console), first without `fulfill`, then with
it after reviewing `missing`.

### Optional: schedule it with pg_cron (Supabase)

Run in the Supabase SQL editor to sweep daily. Keep it calling the same
server function rather than re-implementing fulfillment in SQL:

```sql
-- Requires pg_cron (Database → Extensions). Adjust the service URL/secret
-- to call an admin-authenticated endpoint that invokes reconcilePurchases.
select cron.schedule(
  'reconcile-purchases-daily',
  '0 3 * * *',
  $$ select 1 $$  -- placeholder: wire to the admin endpoint, not raw SQL
);
```

Until then, a weekly manual dry-run after any deploy touching payments,
Stripe keys, or the webhook is the minimum that keeps this honest.

## Why not automatic fulfillment on a timer

Auto-granting on a schedule would turn every Stripe-list misread into real
access. The sweep stays human-approved: machines find the missing orders,
a person grants them.
