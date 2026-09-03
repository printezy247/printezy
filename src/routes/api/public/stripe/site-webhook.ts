import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe webhook for direct website purchases (metadata[source] = "website").
 * The session is re-fetched from Stripe with our secret key, so a forged
 * request can never record a paid purchase.
 */
export const Route = createFileRoute("/api/public/stripe/site-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("stripe-signature") ?? "";
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (webhookSecret) {
          const { verifyStripeSignature } = await import("@/lib/bot/stripe-signature.server");
          const valid = await verifyStripeSignature(raw, signature, webhookSecret);
          if (!valid) return new Response("Invalid signature", { status: 401 });
        }

        let event: { type?: string; data?: { object?: { id?: string } } };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const sessionId = event.data?.object?.id;
        if (event.type !== "checkout.session.completed" || !sessionId) {
          return Response.json({ received: true, ignored: true });
        }

        try {
          const { recordSitePurchase } = await import("@/lib/bot/purchases.server");
          await recordSitePurchase(sessionId);
        } catch (error) {
          console.error("[stripe site-webhook] record error", error);
          return new Response("Recording failed", { status: 500 });
        }

        return Response.json({ received: true });
      },
    },
  },
});
