// Keyword-reply engine for Sarah: detects the language, matches the member's
// text against the reply book, picks one variation at random and renders the
// entry's buttons as a Telegram inline keyboard.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage, telegramCall, type InlineButton } from "./telegram.server";
import { ENTRIES, ENTRY_BY_ID, type Btn, type Entry, type Lang } from "./replies";
import { EXTRA_LANGS, NAV_LABELS, localize, matchWords, type AnyLang } from "./replies.i18n";

export type { Lang, AnyLang };

function nav(lang: AnyLang): InlineButton[] {
  const labels = NAV_LABELS[lang];
  return [
    { text: labels.products, callback_data: "kw:products" },
    { text: labels.faq, callback_data: "kw:faq" },
  ];
}

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

/** Longest trigger phrase wins, so "tradingview pro" beats "pro". */
export function matchEntry(text: string): { entry: Entry; lang: AnyLang } | null {
  const haystack = normalize(text);
  const found: { best: { entry: Entry; lang: AnyLang; len: number } | null } = { best: null };

  const consider = (entry: Entry, lang: AnyLang, phrases: string[]) => {
    for (const phrase of phrases) {
      const needle = normalize(phrase);
      if (needle.trim() && haystack.includes(needle)) {
        if (!found.best || needle.length > found.best.len) {
          found.best = { entry, lang, len: needle.length };
        }
      }
    }
  };

  for (const entry of ENTRIES) {
    if (!entry.match) continue;
    for (const lang of ["en", "ms"] as Lang[]) consider(entry, lang, entry.match[lang] ?? []);
    for (const lang of EXTRA_LANGS) consider(entry, lang, matchWords(entry, lang));
  }
  return found.best ? { entry: found.best.entry, lang: found.best.lang } : null;
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
      if ("buy" in b) return { text: b.text, callback_data: `buy:${b.buy.product}:${b.buy.plan}` };
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
export async function sendEntry(chatId: number, id: string, lang: AnyLang): Promise<boolean> {
  const entry = ENTRY_BY_ID.get(id);
  if (!entry) return false;
  const { replies, buttons } = localize(entry, lang);
  const keyboard = [...toInline(buttons)];
  if (!buttons.length) keyboard.push(nav(lang));
  await typing(chatId);
  await sendMessage(chatId, pick(replies), keyboard);
  return true;
}

/**
 * Handle a free-text message. Returns true when a keyword matched and a reply
 * was sent; false means nobody has an answer and Sarah should be alerted.
 */
export async function handleKeywordMessage(
  chatId: number,
  text: string,
  preferred: AnyLang | null,
): Promise<boolean> {
  const found = matchEntry(text);
  if (!found) return false;
  await sendEntry(chatId, found.entry.id, preferred ?? found.lang);
  return true;
}

// ---------------------------------------------------------------------------
// Website widget: the same reply book, rendered as plain text + links so the
// site chat answers exactly like the bot does.
// ---------------------------------------------------------------------------
export type WebAnswer = {
  text: string;
  links: { label: string; url: string }[];
  quick: { label: string; entryId: string }[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function toWeb(entry: Entry, lang: AnyLang): WebAnswer {
  const { replies, buttons } = localize(entry, lang);
  const text = stripHtml(pick(replies));
  const links: WebAnswer["links"] = [];
  const quick: WebAnswer["quick"] = [];
  for (const row of buttons) {
    for (const b of row) {
      if ("url" in b) links.push({ label: b.text, url: b.url });
      else if ("keyword" in b) quick.push({ label: b.text, entryId: b.keyword });
    }
  }
  if (!quick.length) {
    const labels = NAV_LABELS[lang];
    quick.push(
      { label: labels.products, entryId: "products" },
      { label: labels.faq, entryId: "faq" },
    );
  }
  return { text, links, quick };
}

/** Answer a website message from the reply book, or null when nothing matches. */
export function answerFor(text: string, preferred: AnyLang | null): WebAnswer | null {
  const found = matchEntry(text);
  if (!found) return null;
  return toWeb(found.entry, preferred ?? found.lang);
}

/** Answer a quick-reply tap by entry id. */
export function entryAnswer(id: string, lang: AnyLang): WebAnswer | null {
  const entry = ENTRY_BY_ID.get(id);
  return entry ? toWeb(entry, lang) : null;
}
