-- Every attempt on the signal bridge, accepted or not.
--
-- ezyai_signals only records pushes that SUCCEEDED, which makes its two failure
-- modes indistinguishable: a bot that never called and a bot that called and
-- was turned away both leave an empty table. That ambiguity cost a day of
-- guessing, so the bridge now writes a row for every request it answers —
-- including the 401s and 503s — and the unauthenticated diagnose reports the
-- most recent ones.
--
-- Deliberately holds nothing sensitive: an outcome, a coarse client hint and
-- the bot's own external_id. Never a key, never a header, never a body.
create table if not exists public.ezyai_bridge_hits (
  id uuid primary key default gen_random_uuid(),
  outcome text not null,
  external_id text,
  detail text,
  user_agent text,
  at timestamptz not null default now(),
  constraint ezyai_bridge_hits_outcome_check
    check (outcome in ('accepted','partial','rejected','unauthorized','not_configured','bad_request'))
);

create index if not exists idx_ezyai_bridge_hits_at on public.ezyai_bridge_hits(at desc);

-- Same posture as ezyai_signals: deny-all, so every read and write goes through
-- the service role and nothing here is reachable from a browser.
alter table public.ezyai_bridge_hits enable row level security;

drop policy if exists "ezyai_bridge_hits no public access" on public.ezyai_bridge_hits;
create policy "ezyai_bridge_hits no public access"
  on public.ezyai_bridge_hits for all
  using (false) with check (false);

-- The endpoint is public, so the table is writable by anyone who can reach it.
-- Keep it bounded: on each insert, drop everything past the newest 500 rows.
create or replace function public.trim_ezyai_bridge_hits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ezyai_bridge_hits
  where id in (
    select id from public.ezyai_bridge_hits order by at desc offset 500
  );
  return null;
end;
$$;

drop trigger if exists trg_trim_ezyai_bridge_hits on public.ezyai_bridge_hits;
create trigger trg_trim_ezyai_bridge_hits
  after insert on public.ezyai_bridge_hits
  for each statement execute function public.trim_ezyai_bridge_hits();
