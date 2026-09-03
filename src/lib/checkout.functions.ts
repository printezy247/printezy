import { createServerFn } from "@tanstack/react-start";
import { getCatalogItem } from "./catalog";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  detectStripeEnv,
  getStripeErrorMessage,
} from "./stripe.server";

const ALLOWED_ORIGIN = /^https?:\/\/(localhost:\d+|127\.0\.0\.1:\d+|[a-z0-9-]+\.lovable\.app|[a-z0-9-]+\.lovableproject\.com|(www\.)?printezy\.money)$/i;

type ProfileRow = {
  full_name: string | null;
  telegram_username: string | null;
  experience_level: string | null;
  capital_range: string | null;
  mt5_account: string | null;
};

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sku: string; origin: string; environment: StripeEnv }) => {
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
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    const item = getCatalogItem(data.sku)!;
    try {
      // Resolved server-side from the account's saved profile, never trusted
      // from the client — the profile form is what keeps this filled in.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("full_name, telegram_username, experience_level, capital_range, mt5_account")
        .eq("id", context.userId)
        .maybeSingle();
      const profile = profileData as ProfileRow | null;

      if (!profile?.telegram_username) {
        return { error: "Add your details before checking out." };
      }
      if (item.group === "mt5" && !profile.mt5_account) {
        return { error: "Add your MT5 account number before checking out." };
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
        ...(context.claims.email ? { customer_email: context.claims.email as string } : {}),
        metadata: {
          sku: item.sku,
          source: "website",
          user_id: context.userId,
          telegram_username: profile.telegram_username,
          ...(profile.full_name ? { full_name: profile.full_name } : {}),
          ...(profile.experience_level ? { experience_level: profile.experience_level } : {}),
          ...(profile.capital_range ? { capital_range: profile.capital_range } : {}),
          ...(profile.mt5_account ? { mt5_account: profile.mt5_account } : {}),
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
