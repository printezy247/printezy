import { createServerFn } from "@tanstack/react-start";

const CACHE_KEY = "telegram_member_count";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FALLBACK_COUNT = 640;

type ConfigRow = { value: string; updated_at: string };

export const getActiveMemberCount = createServerFn({ method: "GET" }).handler(
  async (): Promise<number> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("support_config")
      .select("value, updated_at")
      .eq("key", CACHE_KEY)
      .maybeSingle();
    const cached = data as ConfigRow | null;
    const cachedCount = Number(cached?.value);
    const isFresh =
      cached?.updated_at && Date.now() - new Date(cached.updated_at).getTime() < CACHE_TTL_MS;

    if (isFresh && Number.isFinite(cachedCount) && cachedCount > 0) {
      return cachedCount;
    }

    try {
      const { telegramCall } = await import("./bot/telegram.server");
      const result = await telegramCall("getChatMemberCount", { chat_id: "@ezymap" });
      const count = typeof result.result === "number" ? result.result : NaN;
      if (result.ok && Number.isFinite(count) && count > 0) {
        await supabaseAdmin.from("support_config").upsert({
          key: CACHE_KEY,
          value: String(count),
          updated_at: new Date().toISOString(),
        });
        return count;
      }
    } catch (error) {
      console.error("[member-count] telegram fetch failed", error);
    }

    return Number.isFinite(cachedCount) && cachedCount > 0 ? cachedCount : FALLBACK_COUNT;
  },
);
