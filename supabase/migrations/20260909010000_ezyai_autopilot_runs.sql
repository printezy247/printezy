-- Every pass the website's own autopilot makes over the watchlist.
--
-- Two jobs in one table. It is the throttle — a run only starts when the newest
-- row is older than the gap — and it is the audit trail, so "the board is
-- empty" is never again a question without an answer. A row says how many
-- instruments were scanned, what opened, what advanced, what closed, and what
-- went wrong, in the run's own words.
create table if not exists public.ezyai_autopilot_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  scanned integer not null default 0,
  opened integer not null default 0,
  advanced integer not null default 0,
  closed integer not null default 0,
  errors integer not null default 0,
  detail text
);

create index if not exists idx_ezyai_autopilot_runs_started
  on public.ezyai_autopilot_runs(started_at desc);

-- Deny-all, as with ezyai_signals: the service role is the only way in.
alter table public.ezyai_autopilot_runs enable row level security;

drop policy if exists "ezyai_autopilot_runs no public access" on public.ezyai_autopilot_runs;
create policy "ezyai_autopilot_runs no public access"
  on public.ezyai_autopilot_runs for all
  using (false) with check (false);

-- A row per pass, and a pass every few minutes, is a table that grows without
-- end. Keep the newest 300 and let the rest go.
create or replace function public.trim_ezyai_autopilot_runs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ezyai_autopilot_runs
  where id in (
    select id from public.ezyai_autopilot_runs order by started_at desc offset 300
  );
  return null;
end;
$$;

drop trigger if exists trg_trim_ezyai_autopilot_runs on public.ezyai_autopilot_runs;
create trigger trg_trim_ezyai_autopilot_runs
  after insert on public.ezyai_autopilot_runs
  for each statement execute function public.trim_ezyai_autopilot_runs();
