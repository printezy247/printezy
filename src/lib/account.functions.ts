import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().min(8).max(100) });

export type AccountView = {
  found: boolean;
  tier?: string;
  tierName?: string;
  status?: "pending" | "active" | "canceled";
  amountCents?: number;
  currency?: string;
  createdAt?: string;
  activatedAt?: string | null;
  memberName?: string | null;
  memberHandle?: string | null;
  perks?: string[];
};

/**
 * Account portal lookup. The portal token from the bot's personal link is the
 * credential — the table itself is unreadable by anon/authenticated roles.
 * A pending enrollment is re-checked against Stripe so the page is accurate
 * even before the webhook lands.
 */
export const getAccount = createServerFn({ method: "POST" })
  .inputValidator(tokenSchema)
  .handler(async ({ data }): Promise<AccountView> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getTier } = await import("@/lib/bot/tiers");

    const load = async () =>
      supabaseAdmin
        .from("enrollments")
        .select(
          "tier, status, amount_cents, currency, created_at, activated_at, stripe_session_id, telegram_id",
        )
        .eq("portal_token", data.token)
        .maybeSingle();

    let { data: row, error } = await load();
    if (error) console.error("[account] lookup failed", error);
    if (!row) return { found: false };

    let enrollment = row as {
      tier: string;
      status: "pending" | "active" | "canceled";
      amount_cents: number;
      currency: string;
      created_at: string;
      activated_at: string | null;
      stripe_session_id: string | null;
      telegram_id: number;
    };

    if (enrollment.status === "pending" && enrollment.stripe_session_id) {
      try {
        const { activatePaidEnrollment } = await import("@/lib/bot/enrollment.server");
        const activated = await activatePaidEnrollment(enrollment.stripe_session_id);
        if (activated) {
          const refreshed = await load();
          if (refreshed.data) enrollment = refreshed.data as typeof enrollment;
        }
      } catch (err) {
        console.error("[account] stripe sync failed", err);
      }
    }

    const { data: member } = await supabaseAdmin
      .from("bot_users")
      .select("first_name, username")
      .eq("telegram_id", enrollment.telegram_id)
      .maybeSingle();
    const memberRow = member as { first_name: string | null; username: string | null } | null;

    const tier = getTier(enrollment.tier);

    return {
      found: true,
      tier: enrollment.tier,
      tierName: tier?.name ?? enrollment.tier,
      status: enrollment.status,
      amountCents: enrollment.amount_cents,
      currency: enrollment.currency,
      createdAt: enrollment.created_at,
      activatedAt: enrollment.activated_at,
      memberName: memberRow?.first_name ?? null,
      memberHandle: memberRow?.username ?? null,
      perks: tier?.perks ?? [],
    };
  });
