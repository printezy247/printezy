-- 1. Explicit lock-down policies + grant cleanup for service-role-only tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ad_clicks','ezyai_entitlements','macro_calendar_cache','rate_limits',
    'support_config','support_messages','telegram_link_codes'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "No public access to %s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "No public access to %s" ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      t, t);
  END LOOP;
END $$;

-- 2. storage.objects: private ebooks bucket is server-only (service_role bypasses RLS)
DROP POLICY IF EXISTS "No client access to ebooks bucket" ON storage.objects;
CREATE POLICY "No client access to ebooks bucket"
  ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (bucket_id <> 'ebooks') WITH CHECK (bucket_id <> 'ebooks');

-- 3. SECURITY DEFINER functions must not be callable by anon/authenticated
REVOKE ALL ON FUNCTION public.analytics_summary(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_summary(integer) TO service_role;

REVOKE ALL ON FUNCTION public.increment_rate_limit(text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(text, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role stays executable by signed-in users: RLS policies and app code
-- call it as the authenticated role, and it is self-scoped to auth.uid().
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;