import { createServerFn } from "@tanstack/react-start";
import { getCatalogItem } from "./catalog";
import {
  type StripeEnv,
  createStripeClient,
  detectStripeEnv,
  getStripeErrorMessage,
} from "./stripe.server";

const ALLOWED_ORIGIN = /^https?:\/\/(localhost:\d+|127\.0\.0\.1:\d+|[a-z0-9-]+\.lovable\.app|[a-z0-9-]+\.lovableproject\.com|(www\.)?printezy\.money)$/i;

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;

// Guest checkout: no account required. Details are collected in the same
// modal that leads to Stripe and travel as checkout session metadata; the
// account (if any) is created after payment, from this same metadata.
export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      sku: string;
      origin: string;
      environment: StripeEnv;
      telegramUsername: string;
      fullName?: string;
      experienceLevel?: string;
      mt5Account?: string;
      referredBy?: string;
    }) => {
      const item = getCatalogItem(input?.sku ?? "");
      if (typeof input?.sku !== "string" || !item) {
        throw new Error("Unknown product");
      }
      if (typeof input?.origin !== "string" || !ALLOWED_ORIGIN.test(input.origin)) {
        throw new Error("Invalid origin");
      }
      if (input?.environment !== "sandbox" && input?.environment !== "live") {
        throw new Error("Invalid environment");
      }
      const telegramUsername = String(input?.telegramUsername ?? "")
        .trim()
        .replace(/^@+/, "")
        .slice(0, 32);
      if (!/^[A-Za-z0-9_]{5,32}$/.test(telegramUsername)) {
        throw new Error("Enter a valid Telegram username.");
      }
      const mt5Account = input?.mt5Account
        ? String(input.mt5Account).replace(/\D/g, "").slice(0, 20)
        : undefined;
      if (item.group === "mt5" && !mt5Account) {
        throw new Error("Add your MT5 account number before checking out.");
      }
      const fullName = input?.fullName ? String(input.fullName).trim().slice(0, 120) : undefined;
      const experienceLevel = EXPERIENCE_LEVELS.includes(input?.experienceLevel as never)
        ? input.experienceLevel
        : undefined;
      const referredBy = input?.referredBy
        ? String(input.referredBy).trim().toUpperCase().slice(0, 16)
        : undefined;
      return {
        sku: input.sku,
        origin: input.origin,
        environment: input.environment,
        telegramUsername,
        fullName,
        experienceLevel,
        mt5Account,
        referredBy,
      };
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
        metadata: {
          sku: item.sku,
          source: "website",
          telegram_username: data.telegramUsername,
          ...(data.fullName ? { full_name: data.fullName } : {}),
          ...(data.experienceLevel ? { experience_level: data.experienceLevel } : {}),
          ...(data.mt5Account ? { mt5_account: data.mt5Account } : {}),
          ...(data.referredBy ? { referred_by: data.referredBy } : {}),
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
      email: session.customer_details?.email ?? session.customer_email ?? null,
    };
  });
