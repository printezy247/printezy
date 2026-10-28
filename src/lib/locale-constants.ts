export type Locale = "en" | "ms" | "zh" | "hi" | "ar" | "sw";

export const LOCALES: Locale[] = ["en", "ms", "zh", "hi", "ar", "sw"];
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  ms: "BM",
  zh: "中文",
  hi: "हिं",
  ar: "عربي",
  sw: "SW",
};
export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  zh: "🇨🇳",
  ms: "🇲🇾",
  hi: "🇮🇳",
  ar: "🇸🇦",
  sw: "🇰🇪",
};
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu",
  hi: "हिन्दी",
  ar: "العربية",
  sw: "Kiswahili",
};
/** `og:locale` / `inLanguage` tags, trimmed to the region each market reads. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en_US",
  ms: "ms_MY",
  zh: "zh_CN",
  hi: "hi_IN",
  ar: "ar_SA",
  sw: "sw_KE",
};
