import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MyPurchase = {
  id: string;
  sku: string;
  amount_cents: number;
  currency: string;
  status: string;
  claim_code: string | null;
  granted_at: string | null;
  created_at: string;
};

/** Purchases belonging to the signed-in buyer, by account id or verified email. */
export const getMyPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyPurchase[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims as { email?: string } | null)?.email ?? null;

    const filters = [`user_id.eq.${context.userId}`];
    if (email) filters.push(`email.ilike.${email}`);

    const { data, error } = await supabaseAdmin
      .from("site_purchases")
      .select("id, sku, amount_cents, currency, status, claim_code, granted_at, created_at")
      .or(filters.join(","))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[my-account] purchase lookup failed", error);
      return [];
    }
    return (data ?? []) as MyPurchase[];
  });
