// Server-only admin role check.
// has_role() is SECURITY DEFINER and is no longer executable by the
// `authenticated` role, so the check runs through the service-role client
// with a user id that the auth middleware already verified.
export async function isAdminUser(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Could not verify admin access.");
  return data === true;
}

export async function assertAdmin(userId: string): Promise<void> {
  if (!(await isAdminUser(userId))) throw new Error("Admin access required.");
}
