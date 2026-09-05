-- Security hardening (applied to production on 2026-09-05 via Lovable Cloud;
-- kept here so a fresh database gets the same posture).

-- increment_rate_limit is SECURITY DEFINER and only meant for the server's
-- service-role client. Supabase grants EXECUTE on new public functions to
-- anon/authenticated by default, and the original migration only revoked
-- from PUBLIC, so anyone with the publishable key could inflate buckets.
REVOKE EXECUTE ON FUNCTION public.increment_rate_limit(text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(text, timestamptz) TO service_role;

-- ad_clicks is written only by the server (record_ad_click / adclick.functions);
-- the original anon/authenticated INSERT policies let anyone pollute the ads
-- attribution dashboard directly through PostgREST.
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.ad_clicks;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.ad_clicks;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ad_clicks FROM anon, authenticated;

-- The "first account becomes admin" bootstrap has done its job (an admin row
-- exists). Left in place it would hand admin to the next signup if the admin
-- row were ever deleted, and website purchases create accounts automatically.
DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap_admin ON auth.users;
DROP FUNCTION IF EXISTS public.bootstrap_first_admin();
