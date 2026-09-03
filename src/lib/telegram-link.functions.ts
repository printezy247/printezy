import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requestTelegramLinkCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { createLinkCode } = await import("@/lib/bot/account-link.server");
    return createLinkCode(context.userId);
  });

export const getMyTelegramLinkStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getTelegramLinkStatus } = await import("@/lib/bot/account-link.server");
    return getTelegramLinkStatus(context.userId);
  });
