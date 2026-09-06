// Extra languages for Sarah's reply book.
//
// replies.ts stays the English/Malay source of truth (it is shared with the
// Telegram bot). The four other site languages live in one file each as a
// translation layer keyed by entry id: match phrases, reply variations and
// button labels laid out in exactly the same rows/columns as the English
// buttons, so every URL, keyword and product reference is inherited and only
// the visible text changes. An entry with no translation falls back to
// English, never to a blank.
import type { Btn, Entry, Lang } from "./replies";
import { ZH } from "./replies.zh";
import { HI } from "./replies.hi";
import { AR } from "./replies.ar";
import { SW } from "./replies.sw";

export type ExtraLang = "zh" | "hi" | "ar" | "sw";
export type AnyLang = Lang | ExtraLang;

export const EXTRA_LANGS: ExtraLang[] = ["zh", "hi", "ar", "sw"];

export type EntryTranslation = {
  /** Trigger phrases in this language (lowercase, punctuation-free). */
  match?: string[];
  /** Reply variations; same HTML subset as the English replies. */
  replies: string[];
  /** Button labels in the same row/column shape as the entry's English buttons. */
  buttons?: string[][];
};

export type Translation = Record<string, EntryTranslation>;

export const TRANSLATIONS: Record<ExtraLang, Translation> = { zh: ZH, hi: HI, ar: AR, sw: SW };

export const NAV_LABELS: Record<AnyLang, { products: string; faq: string }> = {
  en: { products: "🛍 Products", faq: "❓ FAQ" },
  ms: { products: "🛍 Produk", faq: "❓ FAQ" },
  zh: { products: "🛍 产品", faq: "❓ 常见问题" },
  hi: { products: "🛍 प्रोडक्ट", faq: "❓ FAQ" },
  ar: { products: "🛍 المنتجات", faq: "❓ الأسئلة الشائعة" },
  sw: { products: "🛍 Bidhaa", faq: "❓ Maswali" },
};

export function isExtraLang(value: string): value is ExtraLang {
  return (EXTRA_LANGS as string[]).includes(value);
}

/** Trigger phrases for one entry in an extra language (empty when untranslated). */
export function matchWords(entry: Entry, lang: ExtraLang): string[] {
  return TRANSLATIONS[lang][entry.id]?.match ?? [];
}

/** Replies and buttons for an entry in any of the six site languages. */
export function localize(entry: Entry, lang: AnyLang): { replies: string[]; buttons: Btn[][] } {
  if (lang === "en" || lang === "ms") {
    return {
      replies: entry.replies[lang] ?? entry.replies.en,
      buttons: entry.buttons?.[lang] ?? entry.buttons?.en ?? [],
    };
  }
  const base = entry.buttons?.en ?? [];
  const tr = TRANSLATIONS[lang][entry.id];
  if (!tr || tr.replies.length === 0) return { replies: entry.replies.en, buttons: base };
  const buttons = base.map((row, r) =>
    row.map((b, c) => ({ ...b, text: tr.buttons?.[r]?.[c] ?? b.text })),
  );
  return { replies: tr.replies, buttons };
}
