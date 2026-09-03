import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short, human-readable, unambiguous claim code: EZY-7K4Q-2M9X */
export function newClaimCode(): string {
  const pick = (n: number) =>
    Array.from(
      crypto.getRandomValues(new Uint8Array(n)),
      (b) => CODE_ALPHABET[b % CODE_ALPHABET.length],
    ).join("");
  return `EZY-${pick(4)}-${pick(4)}`;
}

/**
 * Re-fetch a checkout session from Stripe and record it as a paid website
 * purchase. Idempotent: the stripe_session_id column is unique, and an
 * existing row keeps its original claim code.
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

  const existing = await supabaseAdmin
    .from("site_purchases")
    .select("claim_code")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  const claimCode =
    (existing.data as { claim_code: string | null } | null)?.claim_code ?? newClaimCode();

  const { error } = await supabaseAdmin.from("site_purchases").upsert(
    {
      sku: meta.sku ?? "unknown",
      user_id: meta.user_id || null,
      telegram_username: meta.telegram_username ?? null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      status: "paid",
      claim_code: claimCode,
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
