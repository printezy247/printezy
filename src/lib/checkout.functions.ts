import { createServerFn } from "@tanstack/react-start";
import { getCatalogItem } from "./catalog";
import { optionalSupabaseAuth } from "@/integrations/supabase/optional-auth";
import {
  type StripeEnv,
  createStripeClient,
  detectStripeEnv,
  getStripeErrorMessage,
} from "./stripe.server";

const ALLOWED_ORIGIN = /^https?:\/\/(localhost:\d+|127\.0\.0\.1:\d+|[a-z0-9-]+\.lovable\.app|[a-z0-9-]+\.lovableproject\.com|(www\.)?printezy\.money)$/i;

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseAuth])
  .inputValidator(
    (input: {
      sku: string;
      origin: string;
      email?: string;
      telegramUsername: string;
      environment: StripeEnv;
    }) => {
      if (typeof input?.sku !== "string" || !getCatalogItem(input.sku)) {
        throw new Error("Unknown product");
      }
      if (typeof input?.origin !== "string" || !ALLOWED_ORIGIN.test(input.origin)) {
        throw new Error("Invalid origin");
      }
      const handle = String(input?.telegramUsername ?? "").trim().replace(/^@+/, "");
      if (!/^[A-Za-z0-9_]{5,32}$/.test(handle)) {
        throw new Error("Invalid Telegram username");
      }
      if (input?.environment !== "sandbox" && input?.environment !== "live") {
        throw new Error("Invalid environment");
      }
      return { ...input, telegramUsername: handle };
    },
  )
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    const item = getCatalogItem(data.sku)!;
    try {
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
          telegram_username: data.telegramUsername,
          ...(context.userId ? { user_id: context.userId } : {}),
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
