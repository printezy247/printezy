import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type UnfulfilledSession = {
  sessionId: string;
  sku: string | null;
  amountCents: number;
  currency: string;
  paidAt: number;
};

const MAX_LOOKBACK_DAYS = 30;
const MAX_LIMIT = 100;

/**
 * Paid website sessions from the last N days with no site_purchases row —
 * the orders a missed webhook (and a buyer who never opened the success
 * page) would otherwise strand. Read-only: fulfilling is the caller's job.
 */
export async function scanUnfulfilledSessions(
  env: StripeEnv,
  opts: { daysBack?: number; limit?: number } = {},
): Promise<{ scanned: number; missing: UnfulfilledSession[] }> {
  const daysBack = Math.min(Math.max(opts.daysBack ?? 7, 1), MAX_LOOKBACK_DAYS);
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), MAX_LIMIT);
  const stripe = createStripeClient(env);
  const since = Math.floor(Date.now() / 1000) - daysBack * 24 * 60 * 60;

  const listed = await stripe.checkout.sessions.list({
    limit: MAX_LIMIT,
    created: { gte: since },
  });
  const paid = (listed.data ?? []).filter(
    (s) =>
      s.payment_status === "paid" &&
      s.livemode === (env === "live") &&
      (s.metadata as Record<string, string> | null)?.source === "website",
  );

  const ids = paid.map((s) => s.id);
  const recorded = new Set<string>();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const { data, error } = await supabaseAdmin
      .from("site_purchases")
      .select("stripe_session_id")
      .in("stripe_session_id", chunk);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as { stripe_session_id: string }[]) {
      recorded.add(row.stripe_session_id);
    }
  }

  const missing = paid
    .filter((s) => !recorded.has(s.id))
    .slice(0, limit)
    .map((s) => ({
      sessionId: s.id,
      sku: (s.metadata as Record<string, string> | null)?.sku ?? null,
      amountCents: s.amount_total ?? 0,
      currency: s.currency ?? "usd",
      paidAt: s.created ?? 0,
    }));
  return { scanned: paid.length, missing };
}
