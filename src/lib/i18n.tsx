import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type TranslationKey } from "./translations";

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
const RTL_LOCALES: Locale[] = ["ar"];

const STORAGE_KEY = "pe_locale";

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void };
const LocaleContext = createContext<LocaleContextValue>({ locale: "en", setLocale: () => {} });

/**
 * Landing-page localization. Persists the visitor's choice in localStorage;
 * no route-based locale prefix, no server-side detection — a client-only
 * preference toggle, scoped to the landing page. Arabic gets text-direction
 * only (document dir flips to rtl so paragraphs/headings read correctly via
 * the browser's native bidi handling) — layout (nav order, grids, icon
 * placement) intentionally stays left-to-right for every locale.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LOCALES.includes(stored as Locale)) setLocaleState(stored as Locale);
    } catch {
      // Private browsing / storage blocked — default to English.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-critical — the in-memory selection still works for this visit.
    }
  };

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useTranslation() {
  const { locale } = useLocale();
  function t(key: TranslationKey): string {
    return translations[locale][key] ?? translations.en[key] ?? key;
  }
  return { t, locale };
}
