// Bridges website Stripe purchases (site_purchases) to Telegram bot access.
// A buyer who paid on the site is approved automatically the moment their
// Telegram handle is known — either instantly (the handle already belongs to a
// bot user) or when they open @EzyRegisterBot for the first time.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCatalogItem } from "@/lib/catalog";
import { sendMessage } from "./telegram.server";
import { getSarahChatId } from "./sarah.server";
import { FREE_CHANNEL, SUPPORT, newPortalToken, portalUrl } from "./enrollment.server";

type PurchaseRow = {
  id: string;
  sku: string;
  telegram_username: string | null;
  amount_cents: number;
  currency: string;
};

const PURCHASE_COLUMNS = "id, sku, telegram_username, amount_cents, currency";

/** Package SKUs map onto the enrollment tiers the portal already understands. */
const SKU_TIER: Record<string, string> = {
  signal_beginner: "beginner",
  signal_pro: "pro",
  signal_premium: "premium",
  signal_elite: "elite",
};

export function normalizeHandle(username: string | null | undefined): string | null {
  if (!username) return null;
  const handle = username.trim().replace(/^@+/, "").toLowerCase();
  return handle.length > 0 ? handle : null;
}

/** Activate (or top up) the buyer's enrollment for one paid purchase. */
async function grantPurchase(telegramId: number, purchase: PurchaseRow): Promise<void> {
  const item = getCatalogItem(purchase.sku);
  const tier = SKU_TIER[purchase.sku] ?? purchase.sku;
  const nowIso = new Date().toISOString();

  const existing = await supabaseAdmin
    .from("enrollments")
    .select("portal_token")
    .eq("telegram_id", telegramId)
    .eq("tier", tier)
    .eq("status", "active")
    .maybeSingle();

  const token =
    (existing.data as { portal_token: string } | null)?.portal_token ?? newPortalToken();

  if (!existing.data) {
    const { error } = await supabaseAdmin.from("enrollments").insert({
      telegram_id: telegramId,
      tier,
      amount_cents: purchase.amount_cents,
      currency: purchase.currency,
      status: "active",
      portal_token: token,
      activated_at: nowIso,
      activation_source: "website",
    } as never);
    if (error) console.error("[site-access] enrollment insert failed", error);
  }

  const { error: markError } = await supabaseAdmin
    .from("site_purchases")
    .update({ granted_at: nowIso, claimed_by_telegram_id: telegramId } as never)
    .eq("id", purchase.id)
    .is("granted_at", null);
  if (markError) console.error("[site-access] granted_at update failed", markError);

  await sendMessage(
    telegramId,
    `🎉 <b>Purchase confirmed — ${item?.name ?? purchase.sku} is live.</b>\n\nYour access has been approved automatically. Open your account page for your links and status.`,
    [
      [{ text: "My account", url: portalUrl(token) }],
      [{ text: "Join the channel", url: FREE_CHANNEL }],
      [{ text: "Need help?", url: SUPPORT }],
    ],
  );

  const sarah = await getSarahChatId();
  if (sarah) {
    await sendMessage(
      sarah,
      `💳 <b>Website purchase approved</b>\n${item?.name ?? purchase.sku}\nBuyer: @${purchase.telegram_username ?? "unknown"} (id ${telegramId})\nAccess granted automatically — send any manual files if this product needs them.`,
    );
  }
}

/**
 * Claim every ungranted paid purchase belonging to this Telegram handle.
 * Called when a member opens the bot. Idempotent: granted rows are skipped.
 */
export async function claimSitePurchases(args: {
  telegramId: number;
  username?: string | null;
}): Promise<number> {
  const handle = normalizeHandle(args.username);
  if (!handle) return 0;

  const { data, error } = await supabaseAdmin
    .from("site_purchases")
    .select(PURCHASE_COLUMNS)
    .eq("status", "paid")
    .is("granted_at", null)
    .ilike("telegram_username", handle);

  if (error) {
    console.error("[site-access] claim lookup failed", error);
    return 0;
  }

  const rows = (data ?? []) as PurchaseRow[];
  for (const row of rows) await grantPurchase(args.telegramId, row);
  return rows.length;
}

/**
 * Try to grant a freshly recorded purchase right away: if the handle already
 * belongs to a known bot user there is nothing left to wait for.
 */
export async function grantRecordedPurchase(stripeSessionId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("site_purchases")
    .select(PURCHASE_COLUMNS)
    .eq("stripe_session_id", stripeSessionId)
    .is("granted_at", null)
    .maybeSingle();

  const purchase = data as PurchaseRow | null;
  const handle = normalizeHandle(purchase?.telegram_username);
  if (!purchase || !handle) return false;

  const { data: user } = await supabaseAdmin
    .from("bot_users")
    .select("telegram_id")
    .ilike("username", handle)
    .maybeSingle();

  const telegramId = (user as { telegram_id: number } | null)?.telegram_id;
  if (!telegramId) return false;

  await grantPurchase(telegramId, purchase);
  return true;
}

/**
 * Claim a purchase with the one-time code from the success page or email.
 * This is the trusted path: the buyer's real Telegram account is bound to the
 * purchase, so no hand-typed username is involved.
 */
export async function claimByCode(args: {
  telegramId: number;
  username?: string | null;
  code: string;
}): Promise<boolean> {
  const code = args.code.trim().toUpperCase();
  if (!/^EZY-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return false;

  const { data, error } = await supabaseAdmin
    .from("site_purchases")
    .select(PURCHASE_COLUMNS + ", granted_at")
    .eq("claim_code", code)
    .eq("status", "paid")
    .maybeSingle();

  if (error) {
    console.error("[site-access] claim-by-code lookup failed", error);
    return false;
  }

  const row = data as (PurchaseRow & { granted_at: string | null }) | null;
  if (!row) return false;
  if (row.granted_at) return true; // already claimed — idempotent

  const handle = normalizeHandle(args.username);
  if (handle && !row.telegram_username) {
    await supabaseAdmin
      .from("site_purchases")
      .update({ telegram_username: handle } as never)
      .eq("id", row.id);
  }

  await grantPurchase(args.telegramId, row);
  return true;
}
