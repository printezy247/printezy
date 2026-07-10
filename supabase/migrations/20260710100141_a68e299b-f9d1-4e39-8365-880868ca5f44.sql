CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT, SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
GRANT INSERT ON public.analytics_events TO anon;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous event inserts"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Restrict direct reads to service role"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (false);

CREATE OR REPLACE FUNCTION public.analytics_summary(p_days INTEGER DEFAULT 7)
RETURNS TABLE(event_type TEXT, event_name TEXT, total BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    analytics_events.event_type,
    analytics_events.event_name,
    COUNT(*)::BIGINT AS total
  FROM public.analytics_events
  WHERE analytics_events.created_at >= now() - (p_days || ' days')::INTERVAL
  GROUP BY analytics_events.event_type, analytics_events.event_name
  ORDER BY total DESC;
$$;