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
