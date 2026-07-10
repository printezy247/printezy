DROP POLICY IF EXISTS "Allow anonymous event inserts" ON public.analytics_events;

CREATE POLICY "Allow anonymous event inserts"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type IN ('click', 'section_view', 'page_load')
  );