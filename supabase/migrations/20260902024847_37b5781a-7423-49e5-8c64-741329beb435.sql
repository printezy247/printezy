drop policy "Allow anonymous update" on public.ad_clicks;
drop policy "Allow authenticated update" on public.ad_clicks;
revoke update on public.ad_clicks from anon, authenticated;

create or replace function public.record_ad_click(
  p_session_id text,
  p_fbclid text,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_landing_path text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.ad_clicks (session_id, fbclid, utm_source, utm_medium, utm_campaign, landing_path)
  values (p_session_id, p_fbclid, p_utm_source, p_utm_medium, p_utm_campaign, p_landing_path)
  on conflict (session_id) do update
    set fbclid = excluded.fbclid,
        utm_source = excluded.utm_source,
        utm_medium = excluded.utm_medium,
        utm_campaign = excluded.utm_campaign,
        landing_path = excluded.landing_path;
$$;

grant execute on function public.record_ad_click(text, text, text, text, text, text) to anon, authenticated, service_role;