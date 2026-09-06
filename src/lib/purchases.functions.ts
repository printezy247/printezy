import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isEzyAiSku } from "@/lib/catalog";

export type MyPurchase = {
  sku: string;
  amountCents: number;
  currency: string;
  telegramUsername: string | null;
  createdAt: string;
  /** EzyAI PRO only: the code to type into @ezytradeai_bot with /redeem. */
  redeemCode: string | null;
  /** EzyAI PRO only: true once the bot has activated this purchase. */
  redeemed: boolean;
};

/** Website purchases linked to the signed-in account (site_purchases.user_id). */
export const getMyPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyPurchase[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("site_purchases")
      .select("sku, amount_cents, currency, telegram_username, created_at, stripe_session_id")
      .eq("user_id", context.userId)
      .eq("status", "paid")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[purchases] list failed", error);
      throw new Error("Could not load your purchases — please try again.");
    }
    const rows = data ?? [];

    // Attach the PRO code + redeemed state for EzyAI purchases.
    const ezyaiSessions = rows
      .filter((row) => isEzyAiSku(row.sku))
      .map((row) => row.stripe_session_id);
    const codes = new Map<string, { code: string | null; redeemed: boolean }>();
    if (ezyaiSessions.length > 0) {
      const { data: entitlements } = await supabaseAdmin
        .from("ezyai_entitlements")
        .select("stripe_session_id, redeem_code, claimed_at")
        .in("stripe_session_id", ezyaiSessions);
      for (const e of entitlements ?? []) {
        codes.set(e.stripe_session_id, { code: e.redeem_code, redeemed: e.claimed_at !== null });
      }
    }

    return rows.map((row) => {
      const ent = codes.get(row.stripe_session_id);
      return {
        sku: row.sku,
        amountCents: row.amount_cents,
        currency: row.currency,
        telegramUsername: row.telegram_username,
        createdAt: row.created_at,
        redeemCode: ent?.code ?? null,
        redeemed: ent?.redeemed ?? false,
      };
    });
  });
