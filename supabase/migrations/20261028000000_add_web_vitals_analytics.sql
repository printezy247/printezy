ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS metric_value DOUBLE PRECISION;

DROP POLICY IF EXISTS "Allow anonymous event inserts" ON public.analytics_events;

CREATE POLICY "Allow anonymous event inserts"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type IN ('click', 'section_view', 'page_load', 'web_vital')
    AND (event_type <> 'web_vital' OR metric_value IS NOT NULL)
  );
