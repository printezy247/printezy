import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getEbook } from "@/lib/ebooks";
import { escapeHtml, sendMessage } from "./telegram.server";
import { clearSarahSendFailure, getSarahChatId, recordSarahSendFailure } from "./sarah.server";

type ClaimNotice = {
  claimId: string;
  fullName: string;
  telegramUsername: string;
  vantageAccount: string;
  slug: string;
};

/**
 * Website and bot don't share data, and a self-reported Vantage account is
 * not itself proof — Sarah checks it and approves from Telegram before the
 * download unlocks. Callers await this but never let it fail the claim, so the
 * return value is how they find out: `false` means the claim is saved but
 * nobody has been told, and the visitor is shown a direct Telegram link
 * instead of "Sarah will review this shortly".
 */
export async function notifyVantageClaim(notice: ClaimNotice): Promise<boolean> {
  const sarah = await getSarahChatId();
  if (!sarah) {
    await recordSarahSendFailure("ebook claim", "Sarah's chat id is not registered.");
    return false;
  }

  const book = getEbook(notice.slug);
  const lines = [
    `📘 <b>Ebook claim — needs approval</b>`,
    escapeHtml(book ? book.title : notice.slug),
    `Name: ${escapeHtml(notice.fullName)}`,
    `Telegram: @${escapeHtml(notice.telegramUsername)}`,
    `Vantage account: ${escapeHtml(notice.vantageAccount)}`,
  ];

  const sent = await sendMessage(sarah, lines.join("\n"), [
    [{ text: "✅ Approve download", callback_data: `ebook:approve:${notice.claimId}` }],
  ]);
  if (!sent.ok) {
    console.error("[ebook-claims] approval notice failed", sent.error);
    await recordSarahSendFailure("ebook claim", sent.error ?? "unknown Telegram error");
    return false;
  }
  await clearSarahSendFailure();
  return true;
}

/** Sarah tapped Approve — unlock the download for that claim. */
export async function approveEbookClaim(
  claimId: string,
): Promise<{ ok: boolean; alreadyApproved?: boolean; title?: string }> {
  const { data: existing } = await supabaseAdmin
    .from("ebook_claims")
    .select("slug, status")
    .eq("id", claimId)
    .maybeSingle();
  const row = existing as { slug: string; status: string } | null;
  if (!row) return { ok: false };

  const book = getEbook(row.slug);
  if (row.status === "approved") return { ok: true, alreadyApproved: true, title: book?.title };

  const { error } = await supabaseAdmin
    .from("ebook_claims")
    .update({ status: "approved", approved_at: new Date().toISOString() } as never)
    .eq("id", claimId);
  if (error) {
    console.error("[ebook-claims] approve failed", error);
    return { ok: false };
  }
  return { ok: true, title: book?.title };
}
