import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, detectStripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { fulfillSession } from "@/lib/bot/fulfillment.server";

/**
 * Built-in payments webhook (test + live, selected via ?env=).
 * Fulfillment itself lives in lib/bot/fulfillment.server.ts so the
 * reconciliation sweep grants exactly what the webhook would have.
 */

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error(
            "[payments webhook] invalid env — check Stripe webhook URL config:",
            rawEnv,
          );
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        // Only the environment this deployment actually runs may fulfil
        // orders: a sandbox event must never grant access on the live site.
        // Replying 200 is deliberate — this URL is simply pointed at the
        // wrong endpoint, and a 400 would make Stripe retry for days.
        // But it must not be silent either: alert Sarah once per event
        // (deduped via the same event table), so the misconfiguration gets
        // fixed instead of quietly dropping fulfilments.
        if (env !== detectStripeEnv()) {
          console.error("[payments webhook] env mismatch — misconfigured webhook URL:", {
            received: env,
            active: detectStripeEnv(),
          });
          try {
            // The sender signs with the secret of the endpoint it believes
            // it is hitting, so verifying under the received env yields the
            // event id we can dedup alerts on.
            const event = await verifyWebhook(request, env);
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { error: seenError } = await supabaseAdmin
              .from("stripe_webhook_events" as never)
              // Namespaced so this row can never block the real event from
              // fulfilling if the URL is fixed and Stripe re-delivers it.
              .insert({
                event_id: `mismatch:${event.id}`,
                event_type: event.type,
              } as never);
            if (seenError && (seenError as { code?: string }).code !== "23505") throw seenError;
            if (!seenError) {
              const { sendMessage } = await import("@/lib/bot/telegram.server");
              const { getSarahChatId } = await import("@/lib/bot/sarah.server");
              const sarah = await getSarahChatId();
              if (sarah) {
                await sendMessage(
                  sarah,
                  `🚨 <b>Webhook URL misconfigured</b>\nA ${env} Stripe delivery arrived at the ${detectStripeEnv()} webhook. Orders sent this way are NOT fulfilled.\nFix the webhook endpoint URL in the ${env} Stripe dashboard.`,
                );
              }
            }
          } catch (alertError) {
            // Never let alerting failures mask the original problem.
            console.error("[payments webhook] mismatch alert failed", alertError);
          }
          return Response.json({ received: true, ignored: "env not active here" });
        }

        let recordedEventId: string | null = null;
        try {
          const event = await verifyWebhook(request, env);

          // Stripe retries deliveries: the first insert of an event.id wins,
          // a replay finds the row and returns without fulfilling twice.
          // A missing table (migration not applied yet) only logs — the
          // session-level idempotency in fulfillSession still holds.
          // The row is released again if fulfillment below throws, so the
          // retry Stripe sends after a 400 can still fulfill.
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { error: seenError } = await supabaseAdmin
              .from("stripe_webhook_events" as never)
              .insert({
                event_id: event.id,
                event_type: event.type,
              } as never);
            if (seenError && (seenError as { code?: string }).code === "23505") {
              return Response.json({ received: true, duplicate: true });
            }
            if (seenError) throw seenError;
            recordedEventId = event.id;
          } catch (dedupError) {
            if ((dedupError as { code?: string })?.code === "23505") {
              return Response.json({ received: true, duplicate: true });
            }
            console.error("[payments webhook] event dedup skipped", dedupError);
          }

          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              // Only fulfill once money is final (or nothing is due).
              if (session.payment_status !== "unpaid") {
                await fulfillSession(session.id, session.metadata, env);
              }
              break;
            }
            case "checkout.session.async_payment_succeeded": {
              const session = event.data.object;
              await fulfillSession(session.id, session.metadata, env);
              break;
            }
            default:
              console.log("[payments webhook] unhandled event:", event.type);
          }

          return Response.json({ received: true });
        } catch (error) {
          console.error("[payments webhook] error", error);
          if (recordedEventId) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              await supabaseAdmin
                .from("stripe_webhook_events" as never)
                .delete()
                .eq("event_id" as never, recordedEventId as never);
            } catch (releaseError) {
              console.error("[payments webhook] event release failed", releaseError);
            }
          }
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
