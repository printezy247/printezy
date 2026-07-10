REVOKE EXECUTE ON FUNCTION public.analytics_summary(INTEGER) FROM public;
REVOKE ALL ON FUNCTION public.analytics_summary(INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.analytics_summary(INTEGER) FROM authenticated;