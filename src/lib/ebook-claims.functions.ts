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
    async ({ data, context }): Promise<{ ok: true; status: "pending" | "approved" }> => {

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
        if (error) {
        console.error("[db] write failed", error);
        throw new Error("Could not save your changes — please try again.");
      }

        // Awaited on purpose: the worker is torn down as soon as the response
        // goes out, so a fire-and-forget send never reaches Telegram.
        const { notifyVantageClaim } = await import("./bot/ebook-claims.server");
        try {
          await notifyVantageClaim({
            claimId: (row as { id: string }).id,
            fullName: details.fullName,
            telegramUsername: details.telegramUsername,
            vantageAccount: details.vantageAccount,
            slug: data.slug,
          });
        } catch (err) {
          console.error("[ebook-claims] approval notice failed", err);
        }

        return { ok: true, status: "pending" };
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
      if (error) {
        console.error("[db] write failed", error);
        throw new Error("Could not save your changes — please try again.");
      }

      return { ok: true, status: "approved" };
    },
  );

/** Signed URLs live long enough to click, not long enough to share around. */
const EBOOK_LINK_TTL_SECONDS = 60 * 60;

/**
 * The PDFs live in the private `ebooks` storage bucket, so the only way to
 * get one is this signed URL, issued to a signed-in user whose claim for
 * that slug is approved.
 */
export const getEbookDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string }) => {
    if (typeof input?.slug !== "string" || !getEbook(input.slug)) throw new Error("Unknown ebook");
    return { slug: input.slug };
  })
  .handler(async ({ data, context }): Promise<{ downloadUrl: string; readUrl: string }> => {
    const book = getEbook(data.slug)!;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claim } = await supabaseAdmin
      .from("ebook_claims")
      .select("status")
      .eq("user_id", context.userId)
      .eq("slug", data.slug)
      .maybeSingle();
    if ((claim as { status: string } | null)?.status !== "approved") {
      throw new Error("This ebook is not unlocked for your account yet.");
    }

    const bucket = supabaseAdmin.storage.from("ebooks");
    const [download, read] = await Promise.all([
      bucket.createSignedUrl(book.file, EBOOK_LINK_TTL_SECONDS, { download: `${book.slug}.pdf` }),
      bucket.createSignedUrl(book.file, EBOOK_LINK_TTL_SECONDS),
    ]);
    if (download.error || read.error || !download.data || !read.data) {
      console.error("[ebooks] signed url failed", download.error ?? read.error);
      throw new Error("The download is temporarily unavailable — please try again in a few minutes.");
    }
    return { downloadUrl: download.data.signedUrl, readUrl: read.data.signedUrl };
  });
