import type { StripeEnv } from "@/lib/stripe.server";
import { isEzyAiSku } from "@/lib/catalog";
import { recordSitePurchase } from "@/lib/bot/purchases.server";

/**
 * Fulfill one paid checkout session, shared by the Stripe webhook and the
 * reconciliation sweep. All three recorders below are idempotent on
 * stripe_session_id, so calling this twice for the same session grants
 * nothing twice — the second call is a no-op that returns having recorded.
 *
 * Three purchase flows land here:
 * - Website catalog checkouts (metadata.source = "website"): record the
 *   site_purchases row and grant access via EzyRegisterBot.
 * - Website EzyAI PRO checkouts (same source, sku ezyai_*): record the
 *   site_purchases row for the books, then hand delivery to the
 *   ezyai_entitlements bridge polled by @ezytradeai_bot.
 * - Bot-initiated tier checkouts (or legacy sessions): activate the pending
 *   enrollment.
 */
export async function fulfillSession(
  sessionId: string,
  meta: { source?: string; sku?: string } | null | undefined,
  env: StripeEnv,
): Promise<void> {
  if (meta?.source === "website") {
    const recorded = await recordSitePurchase(sessionId, env);
    if (!recorded) return;
    if (isEzyAiSku(meta.sku)) {
      const { recordEzyAiEntitlement } = await import("@/lib/ezyai/entitlements.server");
      await recordEzyAiEntitlement(sessionId, env);
      return;
    }
    const { grantRecordedPurchase } = await import("@/lib/bot/site-access.server");
    await grantRecordedPurchase(sessionId);
    return;
  }
  // Bot-initiated tier checkout (or legacy session): try enrollment activation.
  const { activatePaidEnrollment } = await import("@/lib/bot/enrollment.server");
  await activatePaidEnrollment(sessionId);
}
