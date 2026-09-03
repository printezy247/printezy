import { getEbook } from "@/lib/ebooks";
import { sendMessage } from "./telegram.server";
import { getSarahChatId } from "./sarah.server";

/**
 * Website and bot don't share data, so a self-reported Vantage sign-up
 * (same trust model as the bot's own free trial) needs a human signal to
 * get noticed and reconciled — same rationale as notifySarah in
 * purchases.server.ts. Fire-and-forget; never blocks or fails the claim.
 */
export async function notifyVantageClaim(userEmail: string | null, slug: string): Promise<void> {
  const sarah = await getSarahChatId();
  if (!sarah) return;

  const book = getEbook(slug);
  const lines = [
    `📘 <b>Ebook claim — Vantage self-reported</b>`,
    book ? book.title : slug,
    userEmail ? `Account: ${userEmail}` : null,
  ].filter(Boolean);

  await sendMessage(sarah, lines.join("\n"));
}
