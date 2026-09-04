import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type TranslationKey } from "./translations";

export type Locale = "en" | "ms" | "zh";

export const LOCALES: Locale[] = ["en", "ms", "zh"];
export const LOCALE_LABELS: Record<Locale, string> = { en: "EN", ms: "BM", zh: "中文" };

const STORAGE_KEY = "pe_locale";

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void };
const LocaleContext = createContext<LocaleContextValue>({ locale: "en", setLocale: () => {} });

/**
 * Landing-page localization (English/Malay/Chinese). Persists the visitor's
 * choice in localStorage; no route-based locale prefix, no server-side
 * detection — a client-only preference toggle, scoped to the landing page.
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
