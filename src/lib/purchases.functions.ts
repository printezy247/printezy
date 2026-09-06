import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MyPurchase = {
  sku: string;
  amountCents: number;
  currency: string;
  telegramUsername: string | null;
  createdAt: string;
};

/** Website purchases linked to the signed-in account (site_purchases.user_id). */
export const getMyPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyPurchase[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("site_purchases")
      .select("sku, amount_cents, currency, telegram_username, created_at")
      .eq("user_id", context.userId)
      .eq("status", "paid")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[purchases] list failed", error);
      throw new Error("Could not load your purchases — please try again.");
    }
    return (data ?? []).map((row) => ({
      sku: row.sku,
      amountCents: row.amount_cents,
      currency: row.currency,
      telegramUsername: row.telegram_username,
      createdAt: row.created_at,
    }));
  });
