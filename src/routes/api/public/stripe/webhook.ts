import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe payment webhook. The event payload is only used to learn WHICH
 * checkout session to inspect — the session is then re-fetched from Stripe
 * with our secret key, so a forged request cannot activate an account.
 * When STRIPE_WEBHOOK_SECRET is configured the signature is verified too.
 */
export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("stripe-signature") ?? "";
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (webhookSecret) {
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
          const { activatePaidEnrollment } = await import("@/lib/bot/enrollment.server");
          await activatePaidEnrollment(sessionId);
        } catch (error) {
          console.error("[stripe webhook] activation error", error);
          return new Response("Activation failed", { status: 500 });
        }

        return Response.json({ received: true });
      },
    },
  },
});

async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...rest] = p.split("=");
      return [k?.trim() ?? "", rest.join("=")];
    }),
  ) as { t?: string; v1?: string };

  if (!parts.t || !parts.v1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${parts.t}.${payload}`),
  );
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  }
  return diff === 0;
}
