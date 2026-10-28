import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, detectStripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { fulfillSession } from "@/lib/bot/fulfillment.server";

/**
 * Built-in payments webhook (test + live, selected via ?env=).
 * Fulfillment itself lives in lib/bot/fulfillment.server.ts so the
 * reconciliation sweep grants exactly what the webhook would have.
 */

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
