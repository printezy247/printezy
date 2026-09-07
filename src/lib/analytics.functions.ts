import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const recordSchema = z.object({
  eventType: z.enum(["click", "section_view", "page_load"]),
  eventName: z.string().min(1).max(120),
  path: z.string().max(500),
  referrer: z.string().max(2000).nullable().optional(),
  userAgent: z.string().max(1000).nullable().optional(),
  sessionId: z.string().min(1).max(200),
});

export const recordEvent = createServerFn({ method: "POST" })
  .inputValidator(recordSchema)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return { ok: false, error: "Analytics backend not configured" };
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { error } = await supabase.from("analytics_events").insert({
      event_type: data.eventType,
      event_name: data.eventName,
      path: data.path,
      referrer: data.referrer,
      user_agent: data.userAgent,
      session_id: data.sessionId,
    });

    if (error) {
      console.error("[analytics] insert failed", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  });

const summarySchema = z.object({
  days: z.number().min(1).max(90).default(7),
});

export const getEventSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(summarySchema)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertAdmin } = await import("@/lib/admin-check.server");
    await assertAdmin(context.userId);

    const { data: rows, error } = await supabaseAdmin.rpc("analytics_summary", {
      p_days: data.days,
    });

    if (error) {
      console.error("[analytics] summary failed", error);
      return { summary: [] };
    }

    return { summary: rows ?? [] };
  });

export type CampaignEngagementRow = {
  campaign: string;
  source: string;
  pageLoads: number;
  scroll50: number;
  engaged: number;
};

/**
 * Per-campaign scroll/engagement rates — joins ad_clicks to analytics_events
 * by session_id in JS, same pattern as getAdDashboard (ads.functions.ts)
 * joins ad_clicks to enrollments. No new RPC/migration needed.
 */
export const getCampaignEngagement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(summarySchema)
  .handler(async ({ data, context }): Promise<{ rows: CampaignEngagementRow[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertAdmin } = await import("@/lib/admin-check.server");
    await assertAdmin(context.userId);

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    const [clicksRes, eventsRes] = await Promise.all([
      supabaseAdmin
        .from("ad_clicks")
        .select("session_id, utm_source, utm_campaign, fbclid")
        .gte("created_at", since)
        .limit(2000),
      supabaseAdmin
        .from("analytics_events")
        .select("session_id, event_name")
        .gte("created_at", since)
        .limit(10000),
    ]);

    if (clicksRes.error || eventsRes.error) return { rows: [] };

    const campaignBySession = new Map<string, { campaign: string; source: string }>();
    for (const c of clicksRes.data ?? []) {
      if (!c.session_id) continue;
      campaignBySession.set(c.session_id, {
        campaign: c.utm_campaign ?? (c.fbclid ? "(meta – untagged)" : "(direct)"),
        source: c.utm_source ?? (c.fbclid ? "facebook" : "(none)"),
      });
    }

    const map = new Map<string, CampaignEngagementRow>();
    for (const e of eventsRes.data ?? []) {
      const tag = e.session_id ? campaignBySession.get(e.session_id) : undefined;
      if (!tag) continue;
      const key = `${tag.source}|${tag.campaign}`;
      const cur = map.get(key) ?? {
        campaign: tag.campaign,
        source: tag.source,
        pageLoads: 0,
        scroll50: 0,
        engaged: 0,
      };
      if (e.event_name === "landing") cur.pageLoads += 1;
      if (e.event_name === "scroll_50") cur.scroll50 += 1;
      if (e.event_name === "engaged_15s" || e.event_name === "engaged_scroll") cur.engaged += 1;
      map.set(key, cur);
    }

    return { rows: [...map.values()].sort((a, b) => b.pageLoads - a.pageLoads) };
  });
