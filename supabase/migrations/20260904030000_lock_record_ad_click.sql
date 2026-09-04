-- record_ad_click is SECURITY DEFINER and was granted to anon/authenticated
-- (migration 20260902024847), so any anonymous visitor could call it
-- directly over the PostgREST RPC endpoint and write arbitrary rows into
-- ad_clicks, including overwriting another visitor's fbclid by session_id
-- (the function does ON CONFLICT DO UPDATE). The only caller is
-- src/lib/adclick.functions.ts, a server function now authenticating as
-- service_role — anon/authenticated access is never legitimate.

revoke execute on function public.record_ad_click(text, text, text, text, text, text) from public;
revoke execute on function public.record_ad_click(text, text, text, text, text, text) from anon;
revoke execute on function public.record_ad_click(text, text, text, text, text, text) from authenticated;
grant execute on function public.record_ad_click(text, text, text, text, text, text) to service_role;

-- Defensive length guard so an oversized payload can't be written even by
-- service_role, matching the zod schema in adclick.functions.ts.
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
  values (
    p_session_id,
    left(p_fbclid, 500),
    left(p_utm_source, 200),
    left(p_utm_medium, 200),
    left(p_utm_campaign, 200),
    left(p_landing_path, 500)
  )
  on conflict (session_id) do update
    set fbclid = excluded.fbclid,
        utm_source = excluded.utm_source,
        utm_medium = excluded.utm_medium,
        utm_campaign = excluded.utm_campaign,
        landing_path = excluded.landing_path;
$$;

revoke execute on function public.record_ad_click(text, text, text, text, text, text) from public;
revoke execute on function public.record_ad_click(text, text, text, text, text, text) from anon;
revoke execute on function public.record_ad_click(text, text, text, text, text, text) from authenticated;
grant execute on function public.record_ad_click(text, text, text, text, text, text) to service_role;
