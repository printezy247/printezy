// Server-only enrollment domain logic shared by the Telegram webhook,
// the Stripe webhook and the account portal server function.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  SITE_URL,
  getTier,
  formatPrice,
  VANTAGE_LINK,
  VANTAGE_TRIAL_DAYS,
} from "./tiers";
import { sendMessage } from "./telegram.server";
import { createCheckoutSession, retrieveCheckoutSession } from "./stripe.server";
import { accountLinkFor } from "./member.server";
import { reportMetaEvent } from "./meta.server";

export const FREE_CHANNEL = "https://t.me/ezymap";
export const SUPPORT = "https://t.me/ezysarah";

export function newPortalToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function upsertBotUser(args: {
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
  sessionId?: string | null;
}) {
  const payload: Record<string, unknown> = {
    telegram_id: args.telegramId,
    username: args.username ?? null,
    first_name: args.firstName ?? null,
    updated_at: new Date().toISOString(),
  };
  // Only overwrite the attribution tag when the deep link carried one.
  if (args.sessionId) payload.session_id = args.sessionId;

  const { error } = await supabaseAdmin
    .from("bot_users")
    .upsert(payload as never, { onConflict: "telegram_id" });
  if (error) console.error("[enrollment] upsertBotUser failed", error);
}

export async function getSessionTag(telegramId: number): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("bot_users")
    .select("session_id")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  return (data as { session_id: string | null } | null)?.session_id ?? null;
}

/**
 * A member opening the bot from an ad click is a Lead. Fired once per member
 * (the event_id is stable, so Meta de-duplicates repeat /start commands).
 */
export async function reportLead(telegramId: number, sessionId: string | null) {
  await reportMetaEvent({
    eventName: "Lead",
    sessionId,
    telegramId,
    eventId: `lead_${telegramId}`,
    contentName: "Telegram enrollment bot start",
  });
}

/** Free tier: activate immediately, no payment. */
export async function activateFreeTier(telegramId: number) {
  const existing = await supabaseAdmin
    .from("enrollments")
    .select("portal_token")
    .eq("telegram_id", telegramId)
    .eq("tier", "free")
    .eq("status", "active")
    .maybeSingle();

  const token =
    (existing.data as { portal_token: string } | null)?.portal_token ?? newPortalToken();

  if (!existing.data) {
    const sessionId = await getSessionTag(telegramId);
    const { error } = await supabaseAdmin.from("enrollments").insert({
      telegram_id: telegramId,
      tier: "free",
      amount_cents: 0,
      status: "active",
      portal_token: token,
      session_id: sessionId,
      activated_at: new Date().toISOString(),
    } as never);
    if (error) console.error("[enrollment] free insert failed", error);
  }

  await sendMessage(
    telegramId,
    `✅ <b>You're in.</b>\n\nFree community access is active. Join the channel and open your account page any time.`,
    [
      [{ text: "Join the channel", url: FREE_CHANNEL }],
      [{ text: "My account", url: await accountLinkFor(telegramId) }],
    ],
  );
}

/**
 * Vantage trial, step 1: offer the broker activation route. Tracked as its own
 * StartTrial conversion so free-access interest is measurable separately from
 * paid checkouts.
 */
export async function offerVantageTrial(telegramId: number) {
  const sessionId = await getSessionTag(telegramId);

  await reportMetaEvent({
    eventName: "StartTrial",
    sessionId,
    telegramId,
    eventId: `vantage_start_${telegramId}`,
    contentName: "Vantage trial offered",
    contentId: "vantage",
  });

  await sendMessage(
    telegramId,
    `<b>Free ${VANTAGE_TRIAL_DAYS}-day Pro access — no card needed.</b>\n\nOpen a live account with our broker partner, Vantage Markets, using the link below. Come back and tap <i>I've activated</i> and I'll unlock Pro-level signals, your trade log and stats for ${VANTAGE_TRIAL_DAYS} days so you can test everything before paying.`,
    [
      [{ text: "Open my Vantage account", url: VANTAGE_LINK }],
      [{ text: "I've activated — unlock my trial", callback_data: "vantage:confirm" }],
      [{ text: "Talk to a human", url: SUPPORT }],
    ],
  );
}

/**
 * Vantage trial, step 2: unlock access. Idempotent — an existing live trial is
 * re-sent rather than duplicated.
 */
export async function activateVantageTrial(telegramId: number) {
  const nowIso = new Date().toISOString();

  const existing = await supabaseAdmin
    .from("enrollments")
    .select("portal_token, expires_at")
    .eq("telegram_id", telegramId)
    .eq("tier", "vantage")
    .eq("status", "active")
    .maybeSingle();

  const current = existing.data as { portal_token: string; expires_at: string | null } | null;
  const stillLive = current && (!current.expires_at || current.expires_at > nowIso);

  const token = current?.portal_token ?? newPortalToken();
  const expiresAt = new Date(
    Date.now() + VANTAGE_TRIAL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const sessionId = await getSessionTag(telegramId);

  if (!stillLive) {
    const row = {
      telegram_id: telegramId,
      tier: "vantage",
      amount_cents: 0,
      status: "active",
      portal_token: token,
      session_id: sessionId,
      activated_at: nowIso,
      expires_at: expiresAt,
      activation_source: "vantage",
    };
    const { error } = current
      ? await supabaseAdmin
          .from("enrollments")
          .update(row as never)
          .eq("portal_token", token)
      : await supabaseAdmin.from("enrollments").insert(row as never);
    if (error) console.error("[enrollment] vantage activation failed", error);

    // Own conversion: a completed free activation, distinct from a Purchase.
    await reportMetaEvent({
      eventName: "CompleteRegistration",
      sessionId,
      telegramId,
      eventId: `vantage_active_${telegramId}`,
      contentName: "Vantage trial activated",
      contentId: "vantage",
    });
  }

  await sendMessage(
    telegramId,
    `✅ <b>Trial unlocked.</b>\n\nPro-level access is live for ${VANTAGE_TRIAL_DAYS} days. Open your account for signals, your trade log and stats — upgrade any time and your trial simply rolls into the paid package.`,
    [
      [{ text: "My account", url: await accountLinkFor(telegramId) }],
      [{ text: "Join the channel", url: FREE_CHANNEL }],
    ],
  );
}

/** Paid tier: create a pending enrollment plus a Stripe checkout link. */
export async function startPaidEnrollment(telegramId: number, tierId: string) {
  const tier = getTier(tierId);
  if (!tier || tier.amountCents === 0) return;

  const token = newPortalToken();
  const sessionId = await getSessionTag(telegramId);

  // Stripe sends the buyer back to /account; give that redirect its own
  // short-lived session instead of the permanent portal token.
  const returnUrl = await accountLinkFor(telegramId);
  const checkout = await createCheckoutSession({
    tierId: tier.id,
    tierName: tier.name,
    amountCents: tier.amountCents,
    telegramId,
    portalToken: token,
    sessionId,
    returnUrl,
  });

  const { error } = await supabaseAdmin.from("enrollments").insert({
    telegram_id: telegramId,
    tier: tier.id,
    amount_cents: tier.amountCents,
    status: "pending",
    stripe_session_id: checkout.id,
    portal_token: token,
    session_id: sessionId,
  } as never);
  if (error) console.error("[enrollment] pending insert failed", error);

  await reportMetaEvent({
    eventName: "InitiateCheckout",
    sessionId,
    telegramId,
    eventId: `checkout_${checkout.id}`,
    valueCents: tier.amountCents,
    contentName: tier.name,
    contentId: tier.id,
  });


  await sendMessage(
    telegramId,
    `<b>${tier.name}</b> — ${formatPrice(tier.amountCents)}\n${tier.blurb}\n\n${tier.perks
      .map((p) => `• ${p}`)
      .join("\n")}\n\nComplete your secure payment below. Your account activates the moment it clears.`,
    [
      [{ text: `Pay ${formatPrice(tier.amountCents)} securely`, url: checkout.url ?? SITE_URL }],
      [{ text: "My account", url: returnUrl }],
      [{ text: "Talk to a human", url: SUPPORT }],
    ],
  );
}

/**
 * Mark an enrollment active from a verified Stripe checkout session.
 * Idempotent: re-running for an already active row is a no-op.
 */
export async function activatePaidEnrollment(stripeSessionId: string): Promise<boolean> {
  const session = await retrieveCheckoutSession(stripeSessionId);
  if (session.payment_status !== "paid") return false;

  const { data, error } = await supabaseAdmin
    .from("enrollments")
    .update({
      status: "active",
      activated_at: new Date().toISOString(),
      stripe_payment_intent: session.payment_intent,
    } as never)
    .eq("stripe_session_id", stripeSessionId)
    .neq("status", "active")
    .select("telegram_id, tier, portal_token, amount_cents, currency, session_id")
    .maybeSingle();

  if (error) {
    console.error("[enrollment] activation failed", error);
    return false;
  }
  if (!data) return true; // already active

  const row = data as {
    telegram_id: number;
    tier: string;
    portal_token: string;
    amount_cents: number;
    currency: string;
    session_id: string | null;
  };
  const tier = getTier(row.tier);
  await sendMessage(
    row.telegram_id,
    `🎉 <b>Payment confirmed — ${tier?.name ?? row.tier} is live.</b>\n\nYour access is active. Open your account page for your status and access links.`,
    [
      [{ text: "My account", url: await accountLinkFor(row.telegram_id) }],
      [{ text: "Join the channel", url: FREE_CHANNEL }],
    ],
  );

  // Purchase fires only here — after Stripe confirmed the money, once per
  // checkout session, so Meta's ROAS numbers match real revenue.
  await reportMetaEvent({
    eventName: "Purchase",
    sessionId: row.session_id,
    telegramId: row.telegram_id,
    eventId: `purchase_${stripeSessionId}`,
    valueCents: row.amount_cents,
    currency: row.currency,
    contentName: tier?.name ?? row.tier,
    contentId: row.tier,
  });
  return true;
}
