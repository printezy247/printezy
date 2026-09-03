import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

/**
 * Built-in payments webhook (test + live, selected via ?env=).
 *
 * Two purchase flows land here:
 * - Website catalog checkouts (metadata.source = "website"): record the
 *   site_purchases row and grant access via EzyRegisterBot.
 * - In-bot tier checkouts: activate the pending enrollment.
 */
async function fulfillSession(sessionId: string, source: string | undefined, env: StripeEnv) {
  if (source === "website") {
    const { recordSitePurchase } = await import("@/lib/bot/purchases.server");
    const recorded = await recordSitePurchase(sessionId, env);
    if (recorded) {
      const { grantRecordedPurchase } = await import("@/lib/bot/site-access.server");
      await grantRecordedPurchase(sessionId);
    }
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

        try {
          const event = await verifyWebhook(request, env);

          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              // Only fulfill once money is final (or nothing is due).
              if (session.payment_status !== "unpaid") {
                await fulfillSession(session.id, session.metadata?.source, env);
              }
              break;
            }
            case "checkout.session.async_payment_succeeded": {
              const session = event.data.object;
              await fulfillSession(session.id, session.metadata?.source, env);
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
