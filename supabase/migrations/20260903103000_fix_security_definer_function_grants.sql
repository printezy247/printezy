-- Fixes Supabase database linter warnings:
--   0028_anon_security_definer_function_executable
--   0029_authenticated_security_definer_function_executable
--
-- SECURITY DEFINER functions run with the privileges of their owner and
-- bypass RLS, so PostgreSQL's default PUBLIC EXECUTE grant on newly created
-- functions means anon/authenticated could call them directly via the
-- PostgREST RPC endpoint, not just through the app code paths that were
-- meant to be the only callers.

-- analytics_summary: only ever called from the server using the service-role
-- client (see src/lib/analytics.functions.ts). No app code calls it as
-- anon/authenticated, so neither role needs to execute it directly.
REVOKE EXECUTE ON FUNCTION public.analytics_summary(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_summary(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_summary(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_summary(integer) TO service_role;

-- has_role: every existing caller (getAdminStatus, getAdDashboard) passes the
-- signed-in user's own id — there is no legitimate case today for one user
-- to check another user's role. Restricting it to self-checks closes the
-- role-enumeration hole (an authenticated user probing whether arbitrary
-- other accounts are admins) without changing any existing behavior.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- bootstrap_first_admin: a trigger function on auth.users, never called
-- directly. Trigger execution doesn't require the invoking role to hold an
-- EXECUTE grant, so this is pure hygiene — no user-callable role needs it.
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM authenticated;
