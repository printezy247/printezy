// Server-only Stripe REST helpers (no SDK: keeps the Worker bundle edge-safe).

const STRIPE_API = "https://api.stripe.com/v1";

function stripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return key;
}

function encodeForm(obj: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) params.append(k, String(v));
  }
  return params.toString();
}

async function stripeRequest<T>(
  path: string,
  init?: { method?: string; body?: string },
): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    ...(init?.body ? { body: init.body } : {}),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`[stripe] ${path} failed [${response.status}]: ${text}`);
    throw new Error(`Stripe request failed [${response.status}]: ${text}`);
  }
  return JSON.parse(text) as T;
}

export type CheckoutSession = {
  id: string;
  url: string;
  payment_status: string;
  status: string;
  payment_intent: string | null;
  metadata?: Record<string, string>;
};

export async function createCheckoutSession(args: {
  tierId: string;
  tierName: string;
  amountCents: number;
  telegramId: number;
  portalToken: string;
  sessionId: string | null;
  siteUrl: string;
}): Promise<CheckoutSession> {
  const body = encodeForm({
    mode: "payment",
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": args.amountCents,
    "line_items[0][price_data][product_data][name]": `EzyMap ALGO — ${args.tierName}`,
    success_url: `${args.siteUrl}/account?t=${args.portalToken}&paid=1`,
    cancel_url: `${args.siteUrl}/account?t=${args.portalToken}&canceled=1`,
    "metadata[telegram_id]": args.telegramId,
    "metadata[tier]": args.tierId,
    "metadata[portal_token]": args.portalToken,
    "metadata[session_id]": args.sessionId ?? "",
    client_reference_id: args.portalToken,
  });

  return stripeRequest<CheckoutSession>("/checkout/sessions", { method: "POST", body });
}

export async function retrieveCheckoutSession(id: string): Promise<CheckoutSession> {
  return stripeRequest<CheckoutSession>(`/checkout/sessions/${encodeURIComponent(id)}`);
}

/** Generic one-time checkout for a catalogue SKU bought directly on the site. */
export async function createProductCheckoutSession(args: {
  sku: string;
  productName: string;
  amountCents: number;
  origin: string;
  email?: string;
}): Promise<CheckoutSession> {
  const body = encodeForm({
    mode: "payment",
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": args.amountCents,
    "line_items[0][price_data][product_data][name]": `EzyMap ALGO — ${args.productName}`,
    customer_email: args.email,
    success_url: `${args.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${args.origin}/pricing?canceled=1`,
    "metadata[sku]": args.sku,
    "metadata[source]": "website",
  });

  return stripeRequest<CheckoutSession>("/checkout/sessions", { method: "POST", body });
}
