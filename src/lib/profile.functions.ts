import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Profile = {
  fullName: string | null;
  email: string | null;
  telegramUsername: string | null;
  experienceLevel: string | null;
  capitalRange: string | null;
  mt5Account: string | null;
};

type ProfileRow = {
  full_name: string | null;
  telegram_username: string | null;
  experience_level: string | null;
  capital_range: string | null;
  mt5_account: string | null;
};

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Profile> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("full_name, telegram_username, experience_level, capital_range, mt5_account")
      .eq("id", context.userId)
      .maybeSingle();
    const row = data as ProfileRow | null;
    return {
      fullName: row?.full_name ?? null,
      email: (context.claims.email as string | undefined) ?? null,
      telegramUsername: row?.telegram_username ?? null,
      experienceLevel: row?.experience_level ?? null,
      capitalRange: row?.capital_range ?? null,
      mt5Account: row?.mt5_account ?? null,
    };
  });

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const CAPITAL_RANGES = ["under_1k", "1k_10k", "10k_plus"] as const;

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      fullName: string;
      telegramUsername: string;
      experienceLevel?: string;
      capitalRange?: string;
      mt5Account?: string;
    }) => {
      const fullName = String(input?.fullName ?? "").trim().slice(0, 120);
      const telegramUsername = String(input?.telegramUsername ?? "")
        .trim()
        .replace(/^@+/, "")
        .slice(0, 32);
      if (!/^[A-Za-z0-9_]{5,32}$/.test(telegramUsername)) {
        throw new Error("Invalid Telegram username");
      }
      const experienceLevel = EXPERIENCE_LEVELS.includes(input?.experienceLevel as never)
        ? input.experienceLevel
        : undefined;
      const capitalRange = CAPITAL_RANGES.includes(input?.capitalRange as never)
        ? input.capitalRange
        : undefined;
      const mt5Account = input?.mt5Account ? String(input.mt5Account).replace(/\D/g, "").slice(0, 20) : undefined;
      return { fullName, telegramUsername, experienceLevel, capitalRange, mt5Account };
    },
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").upsert(
      {
        id: context.userId,
        full_name: data.fullName,
        telegram_username: data.telegramUsername,
        ...(data.experienceLevel ? { experience_level: data.experienceLevel } : {}),
        ...(data.capitalRange ? { capital_range: data.capitalRange } : {}),
        ...(data.mt5Account ? { mt5_account: data.mt5Account } : {}),
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
