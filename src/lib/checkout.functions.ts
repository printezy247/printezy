import { createServerFn } from "@tanstack/react-start";
import { getCatalogItem } from "./catalog";
import {
  type StripeEnv,
  createStripeClient,
  detectStripeEnv,
  getStripeErrorMessage,
} from "./stripe.server";

const ALLOWED_ORIGIN = /^https?:\/\/(localhost:\d+|127\.0\.0\.1:\d+|[a-z0-9-]+\.lovable\.app|[a-z0-9-]+\.lovableproject\.com|(www\.)?printezy\.money)$/i;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      sku: string;
      origin: string;
      email?: string;
      userId?: string;
      environment: StripeEnv;
    }) => {
      if (typeof input?.sku !== "string" || !getCatalogItem(input.sku)) {
        throw new Error("Unknown product");
      }
      if (typeof input?.origin !== "string" || !ALLOWED_ORIGIN.test(input.origin)) {
        throw new Error("Invalid origin");
      }
      if (input?.userId && !UUID.test(input.userId)) {
        throw new Error("Invalid user id");
      }
      if (input?.environment !== "sandbox" && input?.environment !== "live") {
        throw new Error("Invalid environment");
      }
      return input;
    },
  )
  .handler(async ({ data }): Promise<{ clientSecret: string } | { error: string }> => {
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
        ...(data.userId ? { client_reference_id: data.userId } : {}),
        metadata: {
          sku: item.sku,
          source: "website",
          ...(data.userId ? { user_id: data.userId } : {}),
        },
      });

      if (!session.client_secret) throw new Error("Stripe did not return a client secret");
      return { clientSecret: session.client_secret };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Read the outcome of a checkout session. Records the purchase if the webhook
 * has not landed yet (preview domains never receive it), so the buyer always
 * gets their claim code on the success page.
 */
export const getCheckoutStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string }) => {
    if (typeof input?.sessionId !== "string" || !/^cs_[A-Za-z0-9_]+$/.test(input.sessionId)) {
      throw new Error("Invalid session id");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const env = detectStripeEnv();
    const stripe = createStripeClient(env);
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
    const paid = session.payment_status === "paid";

    let claimCode: string | null = null;
    if (paid) {
      const { recordSitePurchase } = await import("@/lib/bot/purchases.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      try {
        await recordSitePurchase(data.sessionId, env);
      } catch (error) {
        console.error("[checkout] record on return failed", error);
      }
      const { data: row } = await supabaseAdmin
        .from("site_purchases")
        .select("claim_code")
        .eq("stripe_session_id", data.sessionId)
        .maybeSingle();
      claimCode = (row as { claim_code: string | null } | null)?.claim_code ?? null;
    }

    return {
      paid,
      product: session.metadata?.sku ?? null,
      email: session.customer_details?.email ?? null,
      claimCode,
    };
  });
