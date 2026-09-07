import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns whether the signed-in account holds the admin role.
 * Used to gate private pages such as Track Record and the ads dashboard.
 */
export const getAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean; email: string | null }> => {
    const { isAdminUser } = await import("@/lib/admin-check.server");
    const isAdmin = await isAdminUser(context.userId);
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    return { isAdmin, email };
  });

/**
 * Health of the one Telegram chat every site-to-Sarah notice goes to.
 * A wrong chat id used to fail silently for as long as nobody checked, so the
 * admin dashboard reads this on load and says so in plain language.
 */
export type SupportInboxHealth = {
  ok: boolean;
  chatId: number | null;
  failedAt: string | null;
  source: string | null;
  detail: string | null;
};

export const getSupportInboxHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupportInboxHealth> => {
    const { assertAdmin } = await import("@/lib/admin-check.server");
    await assertAdmin(context.userId);
    const { getSarahInboxHealth } = await import("@/lib/bot/sarah.server");
    return getSarahInboxHealth();
  });
