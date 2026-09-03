import { createServerFn } from "@tanstack/react-start";
import { getCatalogItem } from "./catalog";

const ALLOWED_ORIGIN = /^https?:\/\/(localhost:\d+|[a-z0-9-]+\.lovable\.app|(www\.)?printezy\.money)$/i;

export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { sku: string; origin: string; email?: string; telegramUsername: string }) => {
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
      return { ...input, telegramUsername: handle };
    },
  )
  .handler(async ({ data }) => {
    const item = getCatalogItem(data.sku)!;
    const { createProductCheckoutSession } = await import("./bot/stripe.server");

    const session = await createProductCheckoutSession({
      sku: item.sku,
      productName: `${item.name} (${item.term})`,
      amountCents: item.amountCents,
      origin: data.origin,
      telegramUsername: data.telegramUsername,
      ...(data.email ? { email: data.email } : {}),
    });

    return { url: session.url };
  });

export const getCheckoutStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string }) => {
    if (typeof input?.sessionId !== "string" || !/^cs_[A-Za-z0-9_]+$/.test(input.sessionId)) {
      throw new Error("Invalid session id");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { retrieveCheckoutSession } = await import("./bot/stripe.server");
    const session = await retrieveCheckoutSession(data.sessionId);
    return {
      paid: session.payment_status === "paid",
      product: session.metadata?.sku ?? null,
      telegramUsername: session.metadata?.telegram_username ?? null,
    };
  });
