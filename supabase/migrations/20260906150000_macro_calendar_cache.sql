-- Server-side cache for the ForexFactory weekly calendar feed, so /macro can
-- show today's real releases without hitting the feed on every page view.
-- One row per feed key; read and written with the service role only.
CREATE TABLE IF NOT EXISTS public.macro_calendar_cache (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.macro_calendar_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.macro_calendar_cache FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.macro_calendar_cache TO service_role;
