import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  .inputValidator(summarySchema)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("analytics_summary", {
      p_days: data.days,
    });

    if (error) {
      console.error("[analytics] summary failed", error);
      return { summary: [] };
    }

    return { summary: rows ?? [] };
  });
