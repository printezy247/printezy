import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCatalogItem } from "@/lib/catalog";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";
import { sendMessage } from "./telegram.server";
import { getSarahChatId } from "./sarah.server";

const EXPERIENCE_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/**
 * Guest checkout: no account exists before payment. Create one now (or
 * find the existing one for a repeat buyer's email) from the Stripe
 * session's email + checkout metadata, then upsert their profile.
 * Never blocks the purchase — a failure here just means no account this
 * time, the purchase itself still records.
 */
async function provisionAccount(
  email: string | null,
  meta: Record<string, string>,
): Promise<string | null> {
  if (!email) return null;
  try {
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    let userId = created.data.user?.id ?? null;

    if (!userId) {
      // Most likely "already registered" — look up the existing account.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      userId = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
    }
    if (!userId) return null;

    let referredBy: string | undefined;
    if (meta.referred_by) {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("referred_by")
        .eq("id", userId)
        .maybeSingle();
      const alreadySet = (existingProfile as { referred_by: string | null } | null)?.referred_by;
      if (!alreadySet) {
        const { data: owner } = await supabaseAdmin
          .from("referral_codes")
          .select("user_id")
          .eq("code", meta.referred_by)
          .maybeSingle();
        const ownerId = (owner as { user_id: string } | null)?.user_id;
        if (ownerId && ownerId !== userId) referredBy = meta.referred_by;
      }
    }

    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email,
        ...(meta.full_name ? { full_name: meta.full_name } : {}),
        telegram_username: meta.telegram_username ?? null,
        ...(meta.experience_level ? { experience_level: meta.experience_level } : {}),
        ...(meta.mt5_account ? { mt5_account: meta.mt5_account } : {}),
        ...(referredBy ? { referred_by: referredBy } : {}),
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "id" },
    );

    return userId;
  } catch (error) {
    console.error("[purchases] account provisioning failed", error);
    return null;
  }
}

/**
 * Re-fetch a checkout session from Stripe and record it as a paid website
 * purchase. Idempotent: the stripe_session_id column is unique.
 */
export async function recordSitePurchase(
  stripeSessionId: string,
  env: StripeEnv,
): Promise<boolean> {
  const stripe = createStripeClient(env);
  const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
  if (session.payment_status !== "paid") return false;

  const meta = (session.metadata as Record<string, string> | null) ?? {};
  if (meta.source !== "website") return false;

  // Stripe can retry/re-fire this event; only the first successful record of
  // a session should notify Sarah, so check existence before inserting
  // rather than a blind upsert.
  const { data: existing } = await supabaseAdmin
    .from("site_purchases")
    .select("id")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();
  if (existing) return true;

  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const userId = await provisionAccount(email, meta);

  const { error } = await supabaseAdmin.from("site_purchases").insert({
    sku: meta.sku ?? "unknown",
    telegram_username: meta.telegram_username ?? null,
    user_id: userId,
    full_name: meta.full_name ?? null,
    experience_level: meta.experience_level ?? null,
    mt5_account: meta.mt5_account ?? null,
    email,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    status: "paid",
    stripe_session_id: stripeSessionId,
    stripe_payment_intent:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
  } as never);

  if (error) {
    console.error("[purchases] failed to record site purchase", error);
    throw new Error(error.message);
  }

  await notifySarah(meta, session.amount_total ?? 0, session.currency ?? "usd");
  if (userId) void notifyReferralConversion(userId, meta.sku ?? "unknown");
  return true;
}

/**
 * A referred user just paid — Sarah gets pinged to manually reward the
 * referrer (store credit / free month, her call). No automated payout;
 * same trust model as everything else that reaches her this way.
 */
async function notifyReferralConversion(buyerUserId: string, sku: string) {
  const { data: buyerProfile } = await supabaseAdmin
    .from("profiles")
    .select("referred_by, full_name, telegram_username")
    .eq("id", buyerUserId)
    .maybeSingle();
  const referredBy = (buyerProfile as { referred_by: string | null } | null)?.referred_by;
  if (!referredBy) return;

  const { data: referrerCode } = await supabaseAdmin
    .from("referral_codes")
    .select("user_id")
    .eq("code", referredBy)
    .maybeSingle();
  const referrerId = (referrerCode as { user_id: string } | null)?.user_id;
  if (!referrerId) return;

  const { data: referrerProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, telegram_username")
    .eq("id", referrerId)
    .maybeSingle();
  const referrer = referrerProfile as { full_name: string | null; telegram_username: string | null } | null;
  const buyer = buyerProfile as { full_name: string | null; telegram_username: string | null } | null;

  const item = getCatalogItem(sku);
  const sarah = await getSarahChatId();
  if (!sarah) return;

  await sendMessage(
    sarah,
    [
      `🎁 <b>Referral conversion — reward the referrer</b>`,
      `Referrer: ${referrer?.full_name ?? "unknown"} (@${referrer?.telegram_username ?? "unknown"})`,
      `Bought by: ${buyer?.full_name ?? "unknown"} (@${buyer?.telegram_username ?? "unknown"})`,
      `Product: ${item?.name ?? sku}`,
    ].join("\n"),
  );
}

/**
 * The website and the real Telegram bot are separate systems (they don't
 * share purchase data), so this is the reliable handoff: Sarah/Jack get
 * everything needed to manually reconcile a website sale against the bot's
 * own product/license system, the same way USDT and free-tier signups are
 * already handled there.
 */
async function notifySarah(meta: Record<string, string>, amountCents: number, currency: string) {
  const sarah = await getSarahChatId();
  if (!sarah) return;

  const item = getCatalogItem(meta.sku ?? "");
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);

  const lines = [
    `💳 <b>Website purchase — needs manual fulfillment</b>`,
    `${item?.name ?? meta.sku ?? "Unknown product"} — ${amount}`,
    `Telegram: @${meta.telegram_username ?? "unknown"}`,
    meta.full_name ? `Name: ${meta.full_name}` : null,
    meta.experience_level ? `Experience: ${EXPERIENCE_LABEL[meta.experience_level] ?? meta.experience_level}` : null,
    meta.mt5_account ? `MT5 account: ${meta.mt5_account}` : null,
  ].filter(Boolean);

  await sendMessage(sarah, lines.join("\n"));
}
