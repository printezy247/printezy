import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getEbook } from "./ebooks";

export type EbookClaim = {
  slug: string;
  vantageConfirmed: boolean;
  claimedAt: string;
};

type ClaimRow = {
  slug: string;
  vantage_confirmed: boolean;
  claimed_at: string;
};

export const getMyEbookClaims = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EbookClaim[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("ebook_claims")
      .select("slug, vantage_confirmed, claimed_at")
      .eq("user_id", context.userId);
    return ((data as ClaimRow[] | null) ?? []).map((row) => ({
      slug: row.slug,
      vantageConfirmed: row.vantage_confirmed,
      claimedAt: row.claimed_at,
    }));
  });

export const claimEbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string; vantageConfirmed?: boolean }) => {
    if (typeof input?.slug !== "string" || !getEbook(input.slug)) {
      throw new Error("Unknown ebook");
    }
    return { slug: input.slug, vantageConfirmed: input.vantageConfirmed === true };
  })
  .handler(async ({ data, context }): Promise<{ ok: true; pdf: string }> => {
    const book = getEbook(data.slug)!;
    if (data.slug === "mapping-like-a-pro" && !data.vantageConfirmed) {
      throw new Error("Confirm your Vantage account first.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ebook_claims").upsert(
      {
        user_id: context.userId,
        slug: data.slug,
        vantage_confirmed: data.vantageConfirmed,
        claimed_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id,slug" },
    );
    if (error) throw new Error(error.message);

    if (data.slug === "mapping-like-a-pro") {
      const { notifyVantageClaim } = await import("./bot/ebook-claims.server");
      void notifyVantageClaim((context.claims.email as string | undefined) ?? null, data.slug);
    }

    return { ok: true, pdf: book.pdf };
  });
