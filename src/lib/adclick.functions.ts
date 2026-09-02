import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adClickSchema = z.object({
  sessionId: z.string().min(1).max(200),
  fbclid: z.string().min(1).max(500),
  utmSource: z.string().max(200).nullable().optional(),
  utmMedium: z.string().max(200).nullable().optional(),
  utmCampaign: z.string().max(200).nullable().optional(),
  landingPath: z.string().max(500).nullable().optional(),
});

export const recordAdClick = createServerFn({ method: "POST" })
  .inputValidator(adClickSchema)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return { ok: false, error: "Attribution backend not configured" };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await supabase.from("ad_clicks").upsert(
      {
        session_id: data.sessionId,
        fbclid: data.fbclid,
        utm_source: data.utmSource ?? null,
        utm_medium: data.utmMedium ?? null,
        utm_campaign: data.utmCampaign ?? null,
        landing_path: data.landingPath ?? null,
      },
      { onConflict: "session_id" },
    );

    if (error) {
      console.error("[adclick] upsert failed", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  });
