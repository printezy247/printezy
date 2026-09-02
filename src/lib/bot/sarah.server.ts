// Server-only "Ask Sarah" live chat relay. Members chat with Sarah without
// leaving the bot: their messages are forwarded to Sarah's own Telegram chat,
// and when she replies (Telegram "reply" on a forwarded message) the reply is
// delivered back to the right member.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage, type InlineButton } from "./telegram.server";

export const SUPPORT_LINK = "https://t.me/ezysarah";

/** One-time code Sarah uses to register her chat. Derived from the
 *  connection key so no extra secret is needed and it can't be guessed. */
export async function deriveSupportCode(): Promise<string> {
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");
  const bytes = new TextEncoder().encode(`sarah-support:${TELEGRAM_API_KEY}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 16);
}

export async function getSarahChatId(): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from("support_config")
    .select("value")
    .eq("key", "sarah_chat_id")
    .maybeSingle();
  if (error) console.error("[sarah] config read failed", error);
  const id = Number(data?.value);
  return Number.isFinite(id) && id !== 0 ? id : null;
}

/** /support_login <code> — registers the sender's chat as Sarah's inbox. */
export async function registerSupportChat(chatId: number, code: string): Promise<boolean> {
  if (code !== (await deriveSupportCode())) return false;
  const { error } = await supabaseAdmin
    .from("support_config")
    .upsert({ key: "sarah_chat_id", value: String(chatId), updated_at: new Date().toISOString() });
  if (error) {
    console.error("[sarah] config write failed", error);
    return false;
  }
  return true;
}

async function setChatMode(telegramId: number, on: boolean) {
  // Upsert: the member may reach this from a button tap before any message,
  // so their bot_users row might not exist yet.
  const { error } = await supabaseAdmin
    .from("bot_users")
    .upsert({ telegram_id: telegramId, chat_with_sarah: on, updated_at: new Date().toISOString() });
  if (error) console.error("[sarah] chat mode update failed", error);
}

export async function isInChatMode(telegramId: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("bot_users")
    .select("chat_with_sarah")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (error) console.error("[sarah] chat mode read failed", error);
  return Boolean(data?.chat_with_sarah);
}

const END_CHAT_ROW: InlineButton[] = [{ text: "✖️ End chat", callback_data: "sarah:end" }];

/** Enter chat mode: everything the member types next goes straight to Sarah. */
export async function openSarahChat(chatId: number) {
  const sarahChatId = await getSarahChatId();
  if (!sarahChatId) {
    // Relay not registered yet — fall back to the direct profile link.
    await sendMessage(
      chatId,
      `💬 <b>Ask Sarah</b>\n\nQuestions about packages, payment or access? Sarah answers personally — usually within a few hours.`,
      [[{ text: "Message Sarah now", url: SUPPORT_LINK }], END_CHAT_ROW],
    );
    return;
  }
  await setChatMode(chatId, true);
  await sendMessage(
    chatId,
    `💬 <b>Chat with Sarah</b>\n\nYou're connected. Just type your question here and it goes straight to Sarah — her reply lands back in this chat. Tap <b>End chat</b> when you're done.`,
    [END_CHAT_ROW],
  );
}

/** Leave chat mode (button, /end, or after falling back). */
export async function closeSarahChat(chatId: number) {
  await setChatMode(chatId, false);
  await sendMessage(chatId, `Chat ended. Anything else, I'm here — tap a button below.`, [
    [
      { text: "📦 Packages", callback_data: "menu:packages" },
      { text: "🧾 My status", callback_data: "menu:status" },
    ],
    [{ text: "💬 Ask Sarah", callback_data: "sarah:start" }],
  ]);
}

/**
 * Forward a member's message to Sarah. Stores the sent message id so her
 * Telegram reply can be routed back. Returns false when Sarah's chat isn't
 * registered yet.
 */
export async function relayToSarah(
  member: { telegramId: number; username?: string | null; firstName?: string | null },
  text: string,
): Promise<boolean> {
  const sarahChatId = await getSarahChatId();
  if (!sarahChatId) return false;

  const header = `📩 <b>${member.firstName ?? "Member"}</b>${
    member.username ? ` (@${member.username})` : ""
  } · id <code>${member.telegramId}</code>`;
  const sent = await sendMessage(sarahChatId, `${header}\n\n${text}`);
  if (!sent.ok) {
    console.error("[sarah] forward failed", sent.error);
    return false;
  }

  const sarahMessageId = (sent.result as { message_id?: number } | undefined)?.message_id;
  const { error } = await supabaseAdmin.from("support_messages").insert({
    member_telegram_id: member.telegramId,
    sarah_message_id: sarahMessageId ?? null,
    direction: "to_sarah",
    text,
  });
  if (error) console.error("[sarah] relay log failed", error);
  return true;
}

/**
 * Sarah replied (Telegram reply) to a forwarded message — deliver it to the
 * member it came from. Returns true when a reply was delivered.
 */
export async function relayFromSarah(
  sarahChatId: number,
  replyToMessageId: number | undefined,
  text: string,
): Promise<boolean> {
  if (!replyToMessageId) return false;

  const { data, error } = await supabaseAdmin
    .from("support_messages")
    .select("member_telegram_id")
    .eq("sarah_message_id", replyToMessageId)
    .maybeSingle();
  if (error) console.error("[sarah] reply lookup failed", error);
  const memberId = data?.member_telegram_id;
  if (!memberId) return false;

  const sent = await sendMessage(memberId, `💬 <b>Sarah:</b>\n\n${text}`, [
    [{ text: "✖️ End chat", callback_data: "sarah:end" }],
  ]);
  if (!sent.ok) {
    console.error("[sarah] reply delivery failed", sent.error);
    return false;
  }

  await supabaseAdmin.from("support_messages").insert({
    member_telegram_id: memberId,
    sarah_message_id: null,
    direction: "to_member",
    text,
  });
  return true;
}
