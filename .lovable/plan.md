Yes. Lovable already gives you page-level analytics for the published site (views, visitors, bounce rate, visit duration, traffic sources, devices). For granular metrics like "how many people clicked Free Ebook" or "which section was viewed," we need a small custom event tracker that stores data in your own backend.

This plan adds a built-in, privacy-first analytics system using Lovable Cloud.

## Goals

- Track clicks on all main CTAs: Free Ebook, Pro Analysis, Ask Me Anything, Get Ebook Now, and Get Started.
- Track when key sections become visible: Hero, Ebook, Features, Testimonials, Final CTA.
- Store events in a secure database table with anonymous fingerprints (no PII).
- Expose a simple read-only summary so you can see totals without leaving the project.

## User-facing summary

After this change, every important button and section will silently record anonymous interaction events. You will be able to query counts like "Free Ebook clicks today" or "Ebook section views this week" from a small dashboard or server function. Lovable's built-in page analytics will continue to show top-level traffic separately.

## Technical plan

### 1. Enable Lovable Cloud backend

- Call `supabase--enable` to activate the managed backend (required before any database work).

### 2. Database schema

Create a migration that adds `public.analytics_events`:

```text
id            uuid primary key default gen_random_uuid()
event_type    text not null   -- 'click' | 'section_view' | 'page_load'
event_name    text not null   -- 'free_ebook', 'pro_analysis', 'ask_me_anything', 'get_ebook_now', 'get_started', 'ebook_section', etc.
path          text not null   -- current pathname, e.g. '/'
referrer      text            -- document.referrer or null
user_agent    text            -- browser/OS fingerprint hint
session_id    text not null   -- anonymous session fingerprint (hash)
created_at    timestamptz default now()
```

Include required grants:

```text
GRANT INSERT, SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
```

Enable RLS and add policies:

```text
-- Anyone can insert an anonymous event (public landing page)
CREATE POLICY "Allow public inserts"
  ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only service_role / authenticated reads; no public SELECT on raw rows
CREATE POLICY "Restrict public reads"
  ON public.analytics_events FOR SELECT TO authenticated USING (false);
```

Reads for the dashboard will go through a server function using the service role key.

### 3. Frontend tracking utilities

Add `src/lib/analytics.ts`:

- `track(eventType, eventName)` sends a small POST to a server function.
- `getSessionId()` generates a stable anonymous session id stored in `sessionStorage`.
- `trackSectionVisibility(sections)` uses an IntersectionObserver to fire `section_view` once per section per session when it crosses 50% viewport.

### 4. Instrument the landing page

Update `src/components/landing/Landing.tsx`:

- Wrap each CTA anchor with `onClick={() => track('click', '<name>')}` so the event fires before the browser navigates.
- Add `useEffect` in `Landing` to attach section observers for `hero`, `ebook`, `features`, `testimonials`, `final_cta`.
- Track one `page_load` event on mount.

### 5. Server function to record events

Create `src/lib/analytics.functions.ts`:

```text
export const recordEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ eventType: z.string(), eventName: z.string(), path: z.string(), referrer: z.string().optional(), userAgent: z.string().optional(), sessionId: z.string() }))
  .handler(async ({ data }) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } });
    await supabase.from('analytics_events').insert({ ...data });
    return { ok: true };
  });
```

Uses the publishable-key client because the landing page is public and anonymous; RLS allows anon inserts.

### 6. Read-only analytics summary

Create `src/lib/analytics.functions.ts` (same file) with a protected or service-role function:

```text
export const getEventSummary = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ days: z.number().min(1).max(90).default(7) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: rows } = await supabaseAdmin.rpc('analytics_summary', { p_days: data.days });
    return { summary: rows };
  });
```

Add a Postgres function `analytics_summary(p_days int)` in the same migration that returns grouped counts by event_name and event_type.

### 7. (Optional) Minimal dashboard route

If you want to see the numbers inside the app, add a read-only route `src/routes/_authenticated/analytics.tsx` that renders a simple table/chart of event counts. Since reads are service-role, this route stays behind authentication so only you can open it. This step can be skipped initially; you can query the data directly via the server function or the built-in database tools.

## Files to change

```text
- Enable Lovable Cloud (one-time project action)
- supabase/migrations/... (new migration for analytics_events + summary function)
- src/lib/analytics.ts (new)
- src/lib/analytics.functions.ts (new)
- src/components/landing/Landing.tsx (instrument CTAs and sections)
- src/routes/_authenticated/analytics.tsx (optional dashboard)
```

## Privacy and security notes

- No email, IP, or auth identity is stored. The session id is a random hash, not a login identifier.
- The public insert policy lets anonymous visitors record events; raw reads are blocked from the public.
- Dashboard reads use the service-role client inside a server function, and the route is authenticated-only.

## Verification

- Build passes.
- Click each CTA in the preview and confirm rows appear in `analytics_events`.
- Scroll through sections and confirm `section_view` events are recorded once per session.
- If the dashboard route is added, open it and verify counts match inserted rows.
