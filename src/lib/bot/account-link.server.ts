// Links a signed-in website account to a Telegram account via a short-lived,
// single-use code — replaces typing a raw handle with something that can't
// be mistyped or hijacked by pattern-matching.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { botStartLink } from "@/lib/telegram-links";
import { sendMessage } from "./telegram.server";
import { upsertBotUser } from "./enrollment.server";
import { claimPurchasesForUserId } from "./site-access.server";

const CODE_TTL_MINUTES = 15;
// No 0/O/1/I/L — avoids a human misreading the code when typing it manually.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomLinkCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/** Mints a fresh link code for a signed-in user, invalidating any outstanding one. */
export async function createLinkCode(userId: string): Promise<{ code: string; deepLink: string }> {
  await supabaseAdmin
    .from("telegram_link_codes")
    .update({ used_at: new Date().toISOString() } as never)
    .eq("user_id", userId)
    .is("used_at", null);

  const code = randomLinkCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();

  const { error } = await supabaseAdmin.from("telegram_link_codes").insert({
    code,
    user_id: userId,
    expires_at: expiresAt,
  } as never);
  if (error) throw new Error(error.message);

  return { code, deepLink: botStartLink(`link_${code}`) };
}

export type TelegramLinkStatus = { linked: boolean; telegramUsername: string | null };

export async function getTelegramLinkStatus(userId: string): Promise<TelegramLinkStatus> {
  const { data } = await supabaseAdmin
    .from("account_telegram_links")
    .select("telegram_username")
    .eq("user_id", userId)
    .maybeSingle();
  const row = data as { telegram_username: string | null } | null;
  return { linked: !!row, telegramUsername: row?.telegram_username ?? null };
}

/**
 * Consumes a `link_<code>` /start payload from the bot webhook: verifies the
 * code, links the account, and delivers any purchases already made while
 * signed in. Always messages the member so a bad/expired code isn't silent.
 */
export async function consumeTelegramLinkCode(
  code: string,
  member: { telegramId: number; username: string | null; firstName: string | null },
): Promise<void> {
  await upsertBotUser({
    telegramId: member.telegramId,
    username: member.username,
    firstName: member.firstName,
  });

  const { data } = await supabaseAdmin
    .from("telegram_link_codes")
    .select("user_id, expires_at, used_at")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  const row = data as { user_id: string; expires_at: string; used_at: string | null } | null;

  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    await sendMessage(
      member.telegramId,
      "That link code has expired or was already used. Go back to the website and generate a new one.",
    );
    return;
  }

  const { error: linkError } = await supabaseAdmin.from("account_telegram_links").upsert(
    {
      user_id: row.user_id,
      telegram_id: member.telegramId,
      telegram_username: member.username,
      linked_at: new Date().toISOString(),
    } as never,
    { onConflict: "user_id" },
  );
  if (linkError) {
    console.error("[account-link] upsert failed", linkError);
    await sendMessage(member.telegramId, "Something went wrong linking your account — try again.");
    return;
  }

  await supabaseAdmin
    .from("telegram_link_codes")
    .update({ used_at: new Date().toISOString() } as never)
    .eq("code", code.toUpperCase());

  const granted = await claimPurchasesForUserId(row.user_id, member.telegramId);

  await sendMessage(
    member.telegramId,
    granted > 0
      ? `✅ <b>Telegram linked.</b>\n\nYour account is connected, and ${granted} pending purchase${granted === 1 ? "" : "s"} just unlocked.`
      : `✅ <b>Telegram linked.</b>\n\nYour account is connected — future purchases made while signed in will unlock automatically.`,
  );
}
