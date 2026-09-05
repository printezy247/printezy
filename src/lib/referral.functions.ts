import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function randomCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export const getOrCreateReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ code: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("referral_codes")
      .select("code")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return { code: (existing as { code: string }).code };

    // Retry on the rare collision — code is globally unique.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode();
      const { error } = await supabaseAdmin
        .from("referral_codes")
        .insert({ user_id: context.userId, code } as never);
      if (!error) return { code };
      if (!error.message.includes("duplicate")) {
        console.error("[referral] code insert failed", error);
        throw new Error("Could not create your referral code — please try again.");
      }
    }
    throw new Error("Could not generate a referral code.");
  });

export type ReferralStats = { signups: number; purchases: number };

export const getMyReferralStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReferralStats> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mine } = await supabaseAdmin
      .from("referral_codes")
      .select("code")
      .eq("user_id", context.userId)
      .maybeSingle();
    const code = (mine as { code: string } | null)?.code;
    if (!code) return { signups: 0, purchases: 0 };

    const { count: signups } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", code);

    const { data: referredProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referred_by", code);
    const referredIds = ((referredProfiles as { id: string }[] | null) ?? []).map((p) => p.id);

    let purchases = 0;
    if (referredIds.length > 0) {
      const { count } = await supabaseAdmin
        .from("site_purchases")
        .select("id", { count: "exact", head: true })
        .in("user_id", referredIds)
        .eq("status", "paid");
      purchases = count ?? 0;
    }

    return { signups: signups ?? 0, purchases };
  });
