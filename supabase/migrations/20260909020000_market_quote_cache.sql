-- Server-side cache for the header price ticker.
--
-- Same shape as macro_calendar_cache and for the same reason: the ticker sits
-- on every page, and a quote feed hit once per visitor is a feed that stops
-- answering. One row, refreshed on a short TTL, read by every request.
--
-- It is a cache, not a record. Nothing is served from it that was not a real
-- quote at the moment `fetched_at` says it was.
CREATE TABLE IF NOT EXISTS public.market_quote_cache (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.market_quote_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.market_quote_cache FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.market_quote_cache TO service_role;
