import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, detectStripeEnv, verifyWebhook } from "@/lib/stripe.server";

/**
 * Built-in payments webhook (test + live, selected via ?env=).
 *
 * Three purchase flows land here:
 * - Website catalog checkouts (metadata.source = "website"): record the
 *   site_purchases row and grant access via EzyRegisterBot.
 * - Website EzyAI PRO checkouts (same source, sku ezyai_*): record the
 *   site_purchases row for the books, then hand delivery to the
 *   ezyai_entitlements bridge polled by @ezytradeai_bot.
 * - In-bot tier checkouts: activate the pending enrollment.
 */
async function fulfillSession(
  sessionId: string,
  meta: { source?: string; sku?: string } | null | undefined,
  env: StripeEnv,
) {
  if (meta?.source === "website") {
    const { recordSitePurchase } = await import("@/lib/bot/purchases.server");
    const recorded = await recordSitePurchase(sessionId, env);
    if (!recorded) return;
    const { isEzyAiSku } = await import("@/lib/catalog");
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

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[payments webhook] invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        // Only the environment this deployment actually runs may fulfil
        // orders: a sandbox event must never grant access on the live site.
        if (env !== detectStripeEnv()) {
          return Response.json({ received: true, ignored: "env not active here" });
        }

        try {
          const event = await verifyWebhook(request, env);

          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              // Only fulfill once money is final (or nothing is due).
              if (session.payment_status !== "unpaid") {
                await fulfillSession(session.id, session.metadata, env);
              }
              break;
            }
            case "checkout.session.async_payment_succeeded": {
              const session = event.data.object;
              await fulfillSession(session.id, session.metadata, env);
              break;
            }
            default:
              console.log("[payments webhook] unhandled event:", event.type);
          }

          return Response.json({ received: true });
        } catch (error) {
          console.error("[payments webhook] error", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
