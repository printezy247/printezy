create table public.ad_clicks (
  session_id text primary key,
  fbclid text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  landing_path text,
  created_at timestamptz not null default now()
);

grant insert, update on public.ad_clicks to anon;
grant insert, update on public.ad_clicks to authenticated;
grant all on public.ad_clicks to service_role;

alter table public.ad_clicks enable row level security;

create policy "Allow anonymous insert" on public.ad_clicks
  for insert to anon
  with check (true);

create policy "Allow anonymous update" on public.ad_clicks
  for update to anon
  using (true)
  with check (true);

create policy "Allow authenticated insert" on public.ad_clicks
  for insert to authenticated
  with check (true);

create policy "Allow authenticated update" on public.ad_clicks
  for update to authenticated
  using (true)
  with check (true);