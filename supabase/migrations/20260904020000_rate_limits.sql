-- Lightweight fixed-window rate limiter for public, unauthenticated server
-- functions (guest checkout, lead capture, support chat) now that there is
-- no auth gate anywhere in that funnel. Keyed by an app-chosen bucket string
-- (endpoint + session id + window start), incremented atomically via RPC.

create table if not exists rate_limits (
  bucket_key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);

alter table rate_limits enable row level security;
-- No policies: only the service role (server functions via supabaseAdmin)
-- can read/write this table, same as the other internal-only tables.

create or replace function increment_rate_limit(p_bucket_key text, p_window_start timestamptz)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into rate_limits (bucket_key, count, window_start)
  values (p_bucket_key, 1, p_window_start)
  on conflict (bucket_key)
  do update set count = rate_limits.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

revoke all on function increment_rate_limit(text, timestamptz) from public;
grant execute on function increment_rate_limit(text, timestamptz) to service_role;
