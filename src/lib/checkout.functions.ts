import { createServerFn } from "@tanstack/react-start";
import { getCatalogItem } from "./catalog";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getTelegramLinkStatus } from "./bot/account-link.server";
import {
  type StripeEnv,
  createStripeClient,
  detectStripeEnv,
  getStripeErrorMessage,
} from "./stripe.server";

const ALLOWED_ORIGIN = /^https?:\/\/(localhost:\d+|127\.0\.0\.1:\d+|[a-z0-9-]+\.lovable\.app|[a-z0-9-]+\.lovableproject\.com|(www\.)?printezy\.money)$/i;

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { sku: string; origin: string; email?: string; environment: StripeEnv }) => {
      if (typeof input?.sku !== "string" || !getCatalogItem(input.sku)) {
        throw new Error("Unknown product");
      }
      if (typeof input?.origin !== "string" || !ALLOWED_ORIGIN.test(input.origin)) {
        throw new Error("Invalid origin");
      }
      if (input?.environment !== "sandbox" && input?.environment !== "live") {
        throw new Error("Invalid environment");
      }
      return input;
    },
  )
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    const item = getCatalogItem(data.sku)!;
    try {
      // Server-verified, not client-supplied: checkout requires the
      // signed-in account to already have a Telegram link, so access can
      // never be sent to the wrong handle.
      const link = await getTelegramLinkStatus(context.userId);
      if (!link.linked) {
        return { error: "Connect your Telegram account before checking out." };
      }

      const stripe = createStripeClient(data.environment);

      // Resolve the human-readable sku to the Stripe price via lookup_keys.
      const prices = await stripe.prices.list({ lookup_keys: [item.sku] });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];

      const productId =
        typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: `${data.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        payment_intent_data: { description: product.name },
        ...(data.email ? { customer_email: data.email } : {}),
        metadata: {
          sku: item.sku,
          source: "website",
          user_id: context.userId,
          ...(link.telegramUsername ? { telegram_username: link.telegramUsername } : {}),
        },
      });

      if (!session.client_secret) throw new Error("Stripe did not return a client secret");
      return { clientSecret: session.client_secret };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const getCheckoutStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string }) => {
    if (typeof input?.sessionId !== "string" || !/^cs_[A-Za-z0-9_]+$/.test(input.sessionId)) {
      throw new Error("Invalid session id");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const stripe = createStripeClient(detectStripeEnv());
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
    return {
      paid: session.payment_status === "paid",
      product: session.metadata?.sku ?? null,
      telegramUsername: session.metadata?.telegram_username ?? null,
    };
  });
