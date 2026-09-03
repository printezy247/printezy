import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

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

  const { error } = await supabaseAdmin.from("site_purchases").upsert(
    {
      sku: meta.sku ?? "unknown",
      telegram_username: meta.telegram_username ?? null,
      user_id: meta.user_id ?? null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      status: "paid",
      stripe_session_id: stripeSessionId,
      stripe_payment_intent:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    } as never,
    { onConflict: "stripe_session_id" },
  );

  if (error) {
    console.error("[purchases] failed to record site purchase", error);
    throw new Error(error.message);
  }
  return true;
}
