import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns whether the signed-in account holds the admin role.
 * Used to gate private pages such as Track Record and the ads dashboard.
 */
export const getAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean; email: string | null }> => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error("Could not verify admin access.");
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    return { isAdmin: data === true, email };
  });
