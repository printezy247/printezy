// Bridges website Stripe purchases (site_purchases) to Telegram bot access.
// A buyer who paid on the site is approved automatically the moment their
// Telegram handle is known — either instantly (the handle already belongs to a
// bot user) or when they open @EzyRegisterBot for the first time.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCatalogItem, isEzyAiSku } from "@/lib/catalog";
import { escapeLikePattern } from "@/lib/like-escape";
import { sendMessage } from "./telegram.server";
import { getSarahChatId } from "./sarah.server";
import { FREE_CHANNEL, SUPPORT, newPortalToken } from "./enrollment.server";
import { accountLinkFor } from "./member.server";
import { grantMt5License, isMt5Sku } from "./mt5-license.server";

type PurchaseRow = {
  id: string;
  sku: string;
  telegram_username: string | null;
  amount_cents: number;
  currency: string;
  mt5_account: string | null;
};

const PURCHASE_ROW_COLUMNS = "id, sku, telegram_username, amount_cents, currency, mt5_account";

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
    .update({ granted_at: nowIso } as never)
    .eq("id", purchase.id)
    .is("granted_at", null);
  if (markError) console.error("[site-access] granted_at update failed", markError);

  await sendMessage(
    telegramId,
    `🎉 <b>Purchase confirmed — ${item?.name ?? purchase.sku} is live.</b>\n\nYour access has been approved automatically. Open your account page for your links and status.`,
    [
      [{ text: "My account", url: await accountLinkFor(telegramId) }],
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
 * Grant (or retry) an MT5 tool purchase on the EzyMap License Server.
 * Unlike the signal packages above, this doesn't need a resolved Telegram
 * bot user first - the license is keyed by MT5 account number, which is
 * already on the purchase row from checkout. telegramId (if known) is only
 * used to DM the buyer their confirmation.
 */
async function grantMt5Purchase(purchase: PurchaseRow, telegramId: number | null): Promise<void> {
  const item = getCatalogItem(purchase.sku);
  const account = purchase.mt5_account;
  const nowIso = new Date().toISOString();

  const granted = account
    ? await grantMt5License({
        account,
        sku: purchase.sku,
        note: `Website purchase (telegram=@${purchase.telegram_username ?? "unknown"})`,
      })
    : false;

  if (granted) {
    const { error: markError } = await supabaseAdmin
      .from("site_purchases")
      .update({ granted_at: nowIso } as never)
      .eq("id", purchase.id)
      .is("granted_at", null);
    if (markError) console.error("[site-access] granted_at update failed", markError);
  }

  if (telegramId) {
    const message = granted
      ? `🎉 <b>Purchase confirmed — ${item?.name ?? purchase.sku} is live.</b>\n\nYour MT5 license is active right now on account <code>${account}</code> — attach the indicator and it'll unlock automatically.`
      : `✅ <b>Payment received for ${item?.name ?? purchase.sku}.</b>\n\nWe're finishing setup on your MT5 license — Jack will confirm shortly.`;
    await sendMessage(telegramId, message, [
      [{ text: "Join the channel", url: FREE_CHANNEL }],
      [{ text: "Need help?", url: SUPPORT }],
    ]);
  }

  const sarah = await getSarahChatId();
  if (sarah) {
    const statusLine = granted
      ? `✅ MT5 license auto-granted (account ${account}).`
      : account
        ? `⚠️ Auto-grant failed — grant manually on the license server for account ${account}.`
        : `⚠️ No MT5 account number on file — cannot auto-grant, follow up with the buyer.`;
    await sendMessage(
      sarah,
      `💳 <b>Website MT5 purchase</b>\n${item?.name ?? purchase.sku}\nBuyer: @${purchase.telegram_username ?? "unknown"}${telegramId ? ` (id ${telegramId})` : ""}\n${statusLine}`,
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
    .select(PURCHASE_ROW_COLUMNS)
    .eq("status", "paid")
    .is("granted_at", null)
    .ilike("telegram_username", escapeLikePattern(handle));

  if (error) {
    console.error("[site-access] claim lookup failed", error);
    return 0;
  }

  // EzyAI PRO is delivered by @ezytradeai_bot via ezyai_entitlements, not
  // by this bot — leave those rows alone.
  const rows = ((data ?? []) as PurchaseRow[]).filter((row) => !isEzyAiSku(row.sku));
  for (const row of rows) {
    if (isMt5Sku(row.sku)) {
      await grantMt5Purchase(row, args.telegramId);
    } else {
      await grantPurchase(args.telegramId, row);
    }
  }
  return rows.length;
}

/**
 * Try to grant a freshly recorded purchase right away. MT5 purchases grant
 * immediately regardless of Telegram - signal packages still need a resolved
 * bot user first (the handle already belongs to a known bot user, or there's
 * nothing left to wait for yet - see claimSitePurchases for the retry path).
 */
export async function grantRecordedPurchase(stripeSessionId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("site_purchases")
    .select(PURCHASE_ROW_COLUMNS)
    .eq("stripe_session_id", stripeSessionId)
    .is("granted_at", null)
    .maybeSingle();

  const purchase = data as PurchaseRow | null;
  if (!purchase) return false;

  const handle = normalizeHandle(purchase.telegram_username);
  const { data: user } = handle
    ? await supabaseAdmin
        .from("bot_users")
        .select("telegram_id")
        .ilike("username", escapeLikePattern(handle))
        .maybeSingle()
    : { data: null };
  const telegramId = (user as { telegram_id: number } | null)?.telegram_id ?? null;

  if (isMt5Sku(purchase.sku)) {
    await grantMt5Purchase(purchase, telegramId);
    return true;
  }

  if (!telegramId) return false;
  await grantPurchase(telegramId, purchase);
  return true;
}
