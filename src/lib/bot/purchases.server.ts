import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { retrieveCheckoutSession } from "./stripe.server";

type SessionWithDetails = {
  payment_status: string;
  payment_intent: string | null;
  metadata?: Record<string, string>;
  amount_total?: number;
  currency?: string;
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
};

/**
 * Re-fetch a checkout session from Stripe and record it as a paid website
 * purchase. Idempotent: the stripe_session_id column is unique.
 */
export async function recordSitePurchase(stripeSessionId: string): Promise<boolean> {
  const session = (await retrieveCheckoutSession(stripeSessionId)) as unknown as SessionWithDetails;
  if (session.payment_status !== "paid") return false;

  const meta = session.metadata ?? {};
  if (meta.source !== "website") return false;

  const { error } = await supabaseAdmin.from("site_purchases").upsert(
    {
      sku: meta.sku ?? "unknown",
      telegram_username: meta.telegram_username ?? null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      status: "paid",
      stripe_session_id: stripeSessionId,
      stripe_payment_intent: session.payment_intent,
    } as never,
    { onConflict: "stripe_session_id" },
  );

  if (error) {
    console.error("[purchases] failed to record site purchase", error);
    throw new Error(error.message);
  }
  return true;
}
