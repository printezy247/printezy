import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
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

/**
 * Routes with a real per-locale URL (see src/routes/index.tsx, faq.tsx,
 * ezyai.tsx and their src/routes/ms/{index,faq,ezyai}.tsx twins). On these
 * specific paths en/ms follow the URL, not a stored preference — crawlers
 * and the switcher both need that. Every other locale (zh/hi/ar/sw, no URL
 * anywhere yet) and every other route keep the original client-toggle
 * behavior below.
 */
const ROUTE_LOCALE: Record<string, Locale> = {
  "/": "en",
  "/faq": "en",
  "/ezyai": "en",
  "/ms": "ms",
  "/ms/faq": "ms",
  "/ms/ezyai": "ms",
};

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void };
const LocaleContext = createContext<LocaleContextValue>({ locale: "en", setLocale: () => {} });

/**
 * Persists the visitor's choice in localStorage for routes with no locale
 * URL of their own. Arabic gets text-direction only (document dir flips to
 * rtl so paragraphs/headings read correctly via the browser's native bidi
 * handling) — layout (nav order, grids, icon placement) intentionally stays
 * left-to-right for every locale.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const routeLocale = ROUTE_LOCALE[location.pathname];
  const [storedLocale, setStoredLocale] = useState<Locale>("en");

  useEffect(() => {
    if (routeLocale) return; // URL is authoritative here — ignore any stored preference.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LOCALES.includes(stored as Locale)) setStoredLocale(stored as Locale);
    } catch {
      // Private browsing / storage blocked — default to English.
    }
  }, [routeLocale]);

  // On a route-locked page, en/ms stay tied to the URL — but zh/hi/ar/sw
  // have no URL of their own anywhere, so an explicit pick of one of those
  // still needs to work as a client-side preview (as it always has).
  const isPreviewLocale = storedLocale !== "en" && storedLocale !== "ms";
  const locale = isPreviewLocale ? storedLocale : (routeLocale ?? storedLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = (next: Locale) => {
    if (routeLocale && (next === "en" || next === "ms")) {
      const bare = location.pathname.replace(/^\/ms/, "") || "/";
      const target = next === "ms" ? (bare === "/" ? "/ms" : `/ms${bare}`) : bare;
      window.location.href = `${target}${location.searchStr}${location.hash ? `#${location.hash}` : ""}`;
      return;
    }
    setStoredLocale(next);
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
