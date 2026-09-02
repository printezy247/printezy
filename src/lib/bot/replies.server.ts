// Keyword-reply engine for Sarah: detects the language, matches the member's
// text against the reply book, picks one variation at random and renders the
// entry's buttons as a Telegram inline keyboard.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage, telegramCall, type InlineButton } from "./telegram.server";
import { ENTRIES, ENTRY_BY_ID, DEFAULT_LANG, type Btn, type Entry, type Lang } from "./replies";

export type { Lang };

const NAV: Record<Lang, InlineButton[]> = {
  en: [
    { text: "🛍 Products", callback_data: "kw:products" },
    { text: "❓ FAQ", callback_data: "kw:faq" },
  ],
  ms: [
    { text: "🛍 Produk", callback_data: "kw:products" },
    { text: "❓ FAQ", callback_data: "kw:faq" },
  ],
};

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim()} `;
}

/** Longest trigger phrase wins, so "tradingview pro" beats "pro". */
export function matchEntry(text: string): { entry: Entry; lang: Lang } | null {
  const haystack = normalize(text);
  let best: { entry: Entry; lang: Lang; len: number } | null = null;

  for (const entry of ENTRIES) {
    if (!entry.match) continue;
    for (const lang of ["en", "ms"] as Lang[]) {
      for (const phrase of entry.match[lang] ?? []) {
        const needle = normalize(phrase);
        if (needle.trim() && haystack.includes(needle)) {
          if (!best || needle.length > best.len) best = { entry, lang, len: needle.length };
        }
      }
    }
  }
  return best ? { entry: best.entry, lang: best.lang } : null;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function toInline(rows: Btn[][]): InlineButton[][] {
  return rows.map((row) =>
    row.map((b): InlineButton => {
      if ("url" in b) return { text: b.text, url: b.url };
      if ("keyword" in b) return { text: b.text, callback_data: `kw:${b.keyword}` };
      if ("tiers" in b) return { text: b.text, callback_data: "menu:packages" };
      if ("buy" in b)
        return { text: b.text, callback_data: `buy:${b.buy.product}:${b.buy.plan}` };
      if ("trial" in b) return { text: b.text, callback_data: `trial:${b.trial}` };
      return { text: b.text, callback_data: "sarah:start" };
    }),
  );
}

/** Language preference stored per member, falling back to detection. */
export async function getLang(telegramId: number): Promise<Lang | null> {
  const { data } = await supabaseAdmin
    .from("bot_users")
    .select("lang")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  const lang = (data as { lang?: string } | null)?.lang;
  return lang === "en" || lang === "ms" ? lang : null;
}

export async function setLang(telegramId: number, lang: Lang) {
  const { error } = await supabaseAdmin
    .from("bot_users")
    .upsert({ telegram_id: telegramId, lang, updated_at: new Date().toISOString() });
  if (error) console.error("[replies] lang update failed", error);
}

/** Small "typing…" beat so replies read as a person, not a script. */
async function typing(chatId: number) {
  await telegramCall("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {});
  await new Promise((r) => setTimeout(r, 600));
}

/** Send one reply-book entry by id. Returns false when the id is unknown. */
export async function sendEntry(chatId: number, id: string, lang: Lang): Promise<boolean> {
  const entry = ENTRY_BY_ID.get(id);
  if (!entry) return false;
  const text = pick(entry.replies[lang] ?? entry.replies[DEFAULT_LANG]);
  const rows = entry.buttons?.[lang] ?? entry.buttons?.[DEFAULT_LANG] ?? [];
  const keyboard = [...toInline(rows)];
  if (!rows.length) keyboard.push(NAV[lang]);
  await typing(chatId);
  await sendMessage(chatId, text, keyboard);
  return true;
}

/**
 * Handle a free-text message. Returns true when a keyword matched and a reply
 * was sent; false means nobody has an answer and Sarah should be alerted.
 */
export async function handleKeywordMessage(
  chatId: number,
  text: string,
  preferred: Lang | null,
): Promise<boolean> {
  const found = matchEntry(text);
  if (!found) return false;
  await sendEntry(chatId, found.entry.id, preferred ?? found.lang);
  return true;
}
