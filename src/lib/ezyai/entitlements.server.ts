// Bridges website Stripe purchases of EzyAI PRO to the @ezytradeai_bot.
//
// The bot (tradernonymous/EzyAi) keeps plan state itself and only learns a
// buyer's numeric Telegram id when they open it. Checkout only knows the
// handle typed into the form. So: the payments webhook records one
// ezyai_entitlements row per paid EzyAI SKU, and the bot pulls unclaimed rows
// for a handle (on /start, /plans, /account, PRO gates and a periodic
// sweep), activates PRO locally, then POSTs the claim back here.
//
// Every row also carries a redeem code (EZY-XXXX-XXXX) minted at checkout.
// A buyer whose handle didn't match types it into the bot with /redeem, and
// the bot looks the row up by code instead.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { EZYAI_SKU_MONTHS } from "@/lib/catalog";
import { escapeLikePattern } from "@/lib/like-escape";
import { normalizeHandle } from "@/lib/bot/site-access.server";
import { safeEqual } from "@/lib/bot/telegram.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";
import { REDEEM_CODE_RE, generateRedeemCode, normalizeRedeemCode } from "./redeem-code";

export type EntitlementRow = {
  id: string;
  sku: string;
  months: number;
  telegram_username: string;
  telegram_id: number | null;
  stripe_session_id: string;
  redeem_code: string | null;
  status: "paid" | "claimed" | "revoked";
  claimed_at: string | null;
  created_at: string;
};

const PUBLIC_COLUMNS =
  "id, sku, months, telegram_username, telegram_id, stripe_session_id, redeem_code, status, claimed_at, created_at";

/**
 * Bearer key shared with the bot (EZYAI_ENTITLEMENT_KEY here, EZYAI_SITE_KEY
 * in the bot's env). Returns false when unset so the endpoint is dark until
 * both sides are configured.
 */
export function isAuthorizedBotRequest(request: Request): boolean {
  const expected = process.env.EZYAI_ENTITLEMENT_KEY;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return token.length > 0 && safeEqual(token, expected);
}

/**
 * Re-fetch the checkout session and record it as an EzyAI entitlement.
 * Idempotent via the unique stripe_session_id. Returns the row when a new
 * entitlement was created (or already existed), null when the session is
 * not a paid EzyAI website purchase.
 */
export async function recordEzyAiEntitlement(
  stripeSessionId: string,
  env: StripeEnv,
): Promise<EntitlementRow | null> {
  const stripe = createStripeClient(env);
  const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
  if (session.payment_status !== "paid") return null;
  if (session.livemode !== (env === "live")) return null;

  const meta = (session.metadata as Record<string, string> | null) ?? {};
  const months = EZYAI_SKU_MONTHS[meta.sku ?? ""];
  const handle = normalizeHandle(meta.telegram_username);
  if (meta.source !== "website" || !months || !handle) return null;

  const { data: existing } = await supabaseAdmin
    .from("ezyai_entitlements")
    .select(PUBLIC_COLUMNS)
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();
  if (existing) return existing as EntitlementRow;

  // Prefer the code the buyer already saw (success page, Stripe receipt).
  // Sessions created before codes existed get a fresh one here.
  const minted = meta.redeem_code ?? "";
  let redeemCode = REDEEM_CODE_RE.test(minted) ? minted : generateRedeemCode();

  for (let attempt = 0; ; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("ezyai_entitlements")
      .insert({
        sku: meta.sku,
        months,
        telegram_username: handle,
        email: session.customer_details?.email ?? session.customer_email ?? null,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        stripe_session_id: stripeSessionId,
        redeem_code: redeemCode,
        status: "paid",
      })
      .select(PUBLIC_COLUMNS)
      .single();

    if (!error) return data as EntitlementRow;

    // Unique violation: either a concurrent insert of the same session (the
    // webhook and the success page can race) or, vanishingly, a code clash.
    if (error.code === "23505") {
      const { data: raced } = await supabaseAdmin
        .from("ezyai_entitlements")
        .select(PUBLIC_COLUMNS)
        .eq("stripe_session_id", stripeSessionId)
        .maybeSingle();
      if (raced) return raced as EntitlementRow;
      if (attempt < 2) {
        redeemCode = generateRedeemCode();
        continue;
      }
    }
    console.error("[ezyai] failed to record entitlement", error);
    throw new Error(error.message);
  }
}

/** Unclaimed paid entitlements — for one handle, or every handle (sweep). */
export async function listUnclaimedEntitlements(
  username?: string | null,
): Promise<EntitlementRow[]> {
  let query = supabaseAdmin
    .from("ezyai_entitlements")
    .select(PUBLIC_COLUMNS)
    .eq("status", "paid")
    .is("claimed_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (username !== undefined && username !== null) {
    const handle = normalizeHandle(username);
    if (!handle) return [];
    query = query.ilike("telegram_username", escapeLikePattern(handle));
  }

  const { data, error } = await query;
  if (error) {
    console.error("[ezyai] entitlement lookup failed", error);
    throw new Error(error.message);
  }
  return (data ?? []) as EntitlementRow[];
}

/**
 * The unclaimed entitlement behind a redeem code, as a 0-or-1 element list so
 * the bot can read it with the same shape as the handle lookup. Anything that
 * isn't a well-formed code is simply "not found".
 */
export async function findEntitlementByCode(input: unknown): Promise<EntitlementRow[]> {
  const code = normalizeRedeemCode(input);
  if (!code) return [];
  const { data, error } = await supabaseAdmin
    .from("ezyai_entitlements")
    .select(PUBLIC_COLUMNS)
    .eq("redeem_code", code)
    .eq("status", "paid")
    .is("claimed_at", null)
    .limit(1);
  if (error) {
    console.error("[ezyai] code lookup failed", error);
    throw new Error(error.message);
  }
  return (data ?? []) as EntitlementRow[];
}

/**
 * Mark one entitlement as delivered to a Telegram id. Only flips rows that
 * are still unclaimed, so a bot retry after a crash can't double-claim.
 */
export async function claimEntitlement(
  id: string,
  telegramId: number,
): Promise<EntitlementRow | null> {
  const { data, error } = await supabaseAdmin
    .from("ezyai_entitlements")
    .update({
      telegram_id: telegramId,
      status: "claimed",
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("claimed_at", null)
    .select(PUBLIC_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[ezyai] claim failed", error);
    throw new Error(error.message);
  }
  return (data as EntitlementRow | null) ?? null;
}
