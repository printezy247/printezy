// Server-only checkout helpers for the Telegram bot flow.
// All Stripe calls route through the connector gateway (createStripeClient) —
// the env keys are gateway connection identifiers, not raw Stripe keys.

import { createStripeClient, detectStripeEnv } from "@/lib/stripe.server";

export type CheckoutSession = {
  id: string;
  url: string | null;
  payment_status: string;
  status: string;
  payment_intent: string | null;
  metadata?: Record<string, string> | null;
};

/**
 * Hosted checkout for in-Telegram purchases. Telegram cannot embed a form,
 * so the bot sends the buyer a hosted checkout URL.
 */
export async function createCheckoutSession(args: {
  tierId: string;
  tierName: string;
  amountCents: number;
  telegramId: number;
  portalToken: string;
  sessionId: string | null;
  siteUrl: string;
}): Promise<CheckoutSession> {
  const stripe = createStripeClient(detectStripeEnv());

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: args.amountCents,
          product_data: { name: `EzyMap ALGO — ${args.tierName}` },
        },
      },
    ],
    success_url: `${args.siteUrl}/account?t=${args.portalToken}&paid=1`,
    cancel_url: `${args.siteUrl}/account?t=${args.portalToken}&canceled=1`,
    metadata: {
      telegram_id: String(args.telegramId),
      tier: args.tierId,
      portal_token: args.portalToken,
      session_id: args.sessionId ?? "",
    },
    client_reference_id: args.portalToken,
    payment_intent_data: { description: `EzyMap ALGO — ${args.tierName}` },
  });

  return {
    id: session.id,
    url: session.url,
    payment_status: session.payment_status,
    status: session.status ?? "",
    payment_intent:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    metadata: (session.metadata as Record<string, string>) ?? null,
  };
}

export async function retrieveCheckoutSession(id: string): Promise<CheckoutSession> {
  const stripe = createStripeClient(detectStripeEnv());
  const session = await stripe.checkout.sessions.retrieve(id);
  return {
    id: session.id,
    url: session.url,
    payment_status: session.payment_status,
    status: session.status ?? "",
    payment_intent:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    metadata: (session.metadata as Record<string, string>) ?? null,
  };
}
