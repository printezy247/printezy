import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { detectStripeEnv } from "@/lib/stripe.server";

/**
 * Fulfillment safety net. The webhook is the primary path; this is the
 * sweep for the orders it never saw (delivery outage, misconfigured secret
 * rotation, buyer who paid but never opened the success page). Admin-only,
 * dry-run by default — pass { fulfill: true } to actually grant, and read
 * the report before doing so.
 */
export const reconcilePurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { daysBack?: unknown; limit?: unknown; fulfill?: unknown }) => ({
    daysBack:
      typeof input?.daysBack === "number"
        ? Math.min(Math.max(Math.floor(input.daysBack), 1), 30)
        : 7,
    limit:
      typeof input?.limit === "number" ? Math.min(Math.max(Math.floor(input.limit), 1), 100) : 50,
    fulfill: input?.fulfill === true,
  }))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      scanned: number;
      missing: { sessionId: string; sku: string | null; amountCents: number }[];
      fulfilled: { sessionId: string; ok: boolean; error?: string }[];
    }> => {
      const { assertAdmin } = await import("@/lib/admin-check.server");
      await assertAdmin(context.userId);
      const { scanUnfulfilledSessions } = await import("@/lib/bot/reconciliation.server");
      const env = detectStripeEnv();
      const { scanned, missing } = await scanUnfulfilledSessions(env, {
        daysBack: data.daysBack,
        limit: data.limit,
      });
      const fulfilled: { sessionId: string; ok: boolean; error?: string }[] = [];
      if (data.fulfill) {
        const { fulfillSession } = await import("@/lib/bot/fulfillment.server");
        for (const m of missing) {
          try {
            const stripe = (await import("@/lib/stripe.server")).createStripeClient(env);
            const session = await stripe.checkout.sessions.retrieve(m.sessionId);
            await fulfillSession(m.sessionId, session.metadata as Record<string, string>, env);
            fulfilled.push({ sessionId: m.sessionId, ok: true });
          } catch (error) {
            fulfilled.push({
              sessionId: m.sessionId,
              ok: false,
              error: error instanceof Error ? error.message : "unknown error",
            });
          }
        }
      }
      return {
        scanned,
        missing: missing.map(({ sessionId, sku, amountCents }) => ({
          sessionId,
          sku,
          amountCents,
        })),
        fulfilled,
      };
    },
  );
