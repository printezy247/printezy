import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getEbook } from "./ebooks";

export type EbookClaim = {
  slug: string;
  status: "pending" | "approved";
  claimedAt: string;
};

type ClaimRow = {
  slug: string;
  status: "pending" | "approved";
  claimed_at: string;
};

export const getMyEbookClaims = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EbookClaim[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("ebook_claims")
      .select("slug, status, claimed_at")
      .eq("user_id", context.userId);
    return ((data as ClaimRow[] | null) ?? []).map((row) => ({
      slug: row.slug,
      status: row.status,
      claimedAt: row.claimed_at,
    }));
  });

export const claimEbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      slug: string;
      fullName?: string;
      telegramUsername?: string;
      vantageAccount?: string;
    }) => {
      if (typeof input?.slug !== "string" || !getEbook(input.slug)) {
        throw new Error("Unknown ebook");
      }
      if (input.slug === "mapping-like-a-pro") {
        const fullName = String(input.fullName ?? "").trim().slice(0, 120);
        const telegramUsername = String(input.telegramUsername ?? "")
          .trim()
          .replace(/^@+/, "")
          .slice(0, 32);
        const vantageAccount = String(input.vantageAccount ?? "").replace(/\D/g, "").slice(0, 20);
        if (!fullName) throw new Error("Enter your full name.");
        if (!/^[A-Za-z0-9_]{5,32}$/.test(telegramUsername)) {
          throw new Error("Enter a valid Telegram username.");
        }
        if (!vantageAccount) throw new Error("Enter your Vantage account number.");
        return { slug: input.slug, fullName, telegramUsername, vantageAccount };
      }
      return { slug: input.slug };
    },
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: true; status: "pending" | "approved"; pdf: string | null }> => {
      const book = getEbook(data.slug)!;

      if (data.slug === "mapping-like-a-pro") {
        const details = data as {
          slug: string;
          fullName: string;
          telegramUsername: string;
          vantageAccount: string;
        };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row, error } = await supabaseAdmin
          .from("ebook_claims")
          .upsert(
            {
              user_id: context.userId,
              slug: data.slug,
              full_name: details.fullName,
              telegram_username: details.telegramUsername,
              vantage_account: details.vantageAccount,
              status: "pending",
              claimed_at: new Date().toISOString(),
            } as never,
            { onConflict: "user_id,slug" },
          )
          .select("id")
          .single();
        if (error) throw new Error(error.message);

        const { notifyVantageClaim } = await import("./bot/ebook-claims.server");
        void notifyVantageClaim({
          claimId: (row as { id: string }).id,
          fullName: details.fullName,
          telegramUsername: details.telegramUsername,
          vantageAccount: details.vantageAccount,
          slug: data.slug,
        });

        return { ok: true, status: "pending", pdf: null };
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("ebook_claims").upsert(
        {
          user_id: context.userId,
          slug: data.slug,
          status: "approved",
          claimed_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id,slug" },
      );
      if (error) throw new Error(error.message);

      return { ok: true, status: "approved", pdf: book.pdf };
    },
  );
