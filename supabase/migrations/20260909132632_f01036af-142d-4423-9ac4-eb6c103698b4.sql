REVOKE ALL ON FUNCTION public.trim_ezyai_autopilot_runs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trim_ezyai_bridge_hits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trim_ezyai_autopilot_runs() TO service_role;
GRANT EXECUTE ON FUNCTION public.trim_ezyai_bridge_hits() TO service_role;