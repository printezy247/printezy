// Server-only Meta Conversions API (CAPI) reporting.
//
// Ad clicks land on the site with ?fbclid=... and are stored in `ad_clicks`
// keyed by the analytics sessionId. That same short sessionId travels into
// Telegram via ?start=<sessionId>, so when a member starts the bot, picks a
// package or pays, we can look the click back up and report the conversion
// to Meta server-side — which is what makes the ad campaign optimise.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "./tiers";

const GRAPH_VERSION = "v21.0";

export type MetaEventName =
  | "Lead"
  | "InitiateCheckout"
  | "Purchase"
  | "StartTrial"
  | "CompleteRegistration";

type AdClick = {
  session_id: string;
  fbclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_path: string | null;
  created_at: string;
};

function metaConfig() {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const testEventCode = process.env.META_TEST_EVENT_CODE || undefined;
  if (!pixelId || !accessToken) return null;
  return { pixelId, accessToken, testEventCode };
}

/** Meta's click identifier format: fb.<subdomainIndex>.<clickTimeMs>.<fbclid> */
function buildFbc(click: AdClick): string | null {
  if (!click.fbclid) return null;
  const ms = new Date(click.created_at).getTime();
  return `fb.1.${Number.isFinite(ms) ? ms : Date.now()}.${click.fbclid}`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value.trim().toLowerCase()),
  );
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function findAdClick(sessionId: string | null): Promise<AdClick | null> {
  if (!sessionId) return null;
  const { data, error } = await supabaseAdmin
    .from("ad_clicks")
    .select("session_id, fbclid, utm_source, utm_medium, utm_campaign, landing_path, created_at")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) {
    console.error("[meta] ad_click lookup failed", error);
    return null;
  }
  return (data as AdClick | null) ?? null;
}

/**
 * Send one conversion to Meta. Silently no-ops when the pixel isn't configured
 * or when this member never came from an ad — reporting must never break the
 * enrollment flow.
 */
export async function reportMetaEvent(args: {
  eventName: MetaEventName;
  sessionId: string | null;
  telegramId: number;
  eventId: string;
  valueCents?: number;
  currency?: string;
  contentName?: string;
  contentId?: string;
}): Promise<boolean> {
  const config = metaConfig();
  if (!config) return false;

  const click = await findAdClick(args.sessionId);
  const fbc = click ? buildFbc(click) : null;
  // No click identifier and no other strong signal → Meta cannot attribute it.
  if (!fbc) return false;

  const userData: Record<string, unknown> = {
    fbc,
    external_id: await sha256Hex(String(args.telegramId)),
  };

  const customData: Record<string, unknown> = {};
  if (args.valueCents !== undefined) {
    customData.value = args.valueCents / 100;
    customData.currency = (args.currency ?? "usd").toUpperCase();
  }
  if (args.contentName) customData.content_name = args.contentName;
  if (args.contentId) {
    customData.content_ids = [args.contentId];
    customData.content_type = "product";
  }
  if (click?.utm_campaign) customData.campaign = click.utm_campaign;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: args.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: args.eventId,
        action_source: "website",
        event_source_url: `${SITE_URL}${click?.landing_path ?? "/"}`,
        user_data: userData,
        ...(Object.keys(customData).length ? { custom_data: customData } : {}),
      },
    ],
  };
  if (config.testEventCode) payload.test_event_code = config.testEventCode;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${config.pixelId}/events?access_token=${encodeURIComponent(config.accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const text = await response.text();
    if (!response.ok) {
      console.error(`[meta] ${args.eventName} failed [${response.status}]: ${text}`);
      return false;
    }
    console.log(`[meta] ${args.eventName} reported for session ${args.sessionId}`);
    return true;
  } catch (error) {
    console.error("[meta] request error", error);
    return false;
  }
}
