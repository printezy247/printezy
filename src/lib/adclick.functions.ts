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
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { ok: false, error: "Attribution backend not configured" };
    }

    // This is a server function (never runs in the browser), so it should
    // authenticate as service_role, not the public anon key — record_ad_click
    // is SECURITY DEFINER and its anon/authenticated grants have been
    // revoked (see the lock_record_ad_click migration).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.rpc("record_ad_click", {
      p_session_id: data.sessionId,
      p_fbclid: data.fbclid,
      p_utm_source: data.utmSource ?? undefined,
      p_utm_medium: data.utmMedium ?? undefined,
      p_utm_campaign: data.utmCampaign ?? undefined,
      p_landing_path: data.landingPath ?? undefined,
    });

    if (error) {
      console.error("[adclick] upsert failed", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  });
