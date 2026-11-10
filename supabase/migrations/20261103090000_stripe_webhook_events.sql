-- Stripe webhook deliveries are retried and can arrive twice: record every
-- processed event.id so a replay is a no-op. The webhook inserts before
-- fulfilling; a duplicate insert means another delivery already handled it.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from public, anon, authenticated;
grant all on public.stripe_webhook_events to service_role;
