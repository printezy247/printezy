-- Autopilot signals published by the admin's EzyAI account.
--
-- Written only by @ezytradeai_bot through /api/public/ezyai/signals, read only
-- by the website's own server functions: RLS denies anon and authenticated
-- outright, exactly like public.signals, so every path goes through the
-- service role. `external_id` is the bot's own id for the trade, which makes
-- every push idempotent — a repeated open cannot create a second card, and a
-- price tick is just a partial update of the row it already owns.
create table if not exists public.ezyai_signals (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  symbol text not null,
  direction text not null default 'buy',
  status text not null default 'pending',
  setup text,
  timeframe text,
  entry_low numeric,
  entry_high numeric,
  entry_fill numeric,
  stop_price numeric,
  tp1 numeric,
  tp2 numeric,
  rr numeric,
  setup_score integer,
  last_price numeric,
  result_pips numeric,
  result_r numeric,
  note text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint ezyai_signals_status_check
    check (status in ('pending','running','tp','be','sl','cancelled')),
  constraint ezyai_signals_direction_check check (direction in ('buy','sell')),
  constraint ezyai_signals_score_check
    check (setup_score is null or (setup_score >= 0 and setup_score <= 100))
);

create index if not exists idx_ezyai_signals_live on public.ezyai_signals(status, opened_at desc);
create index if not exists idx_ezyai_signals_closed on public.ezyai_signals(closed_at desc);

grant all on public.ezyai_signals to service_role;
alter table public.ezyai_signals enable row level security;

drop policy if exists "No public access to ezyai signals" on public.ezyai_signals;
create policy "No public access to ezyai signals" on public.ezyai_signals
  for all to anon, authenticated using (false) with check (false);
