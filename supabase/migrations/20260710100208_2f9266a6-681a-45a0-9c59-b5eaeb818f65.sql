REVOKE ALL ON FUNCTION public.analytics_summary(INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.analytics_summary(INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_summary(INTEGER) TO service_role;