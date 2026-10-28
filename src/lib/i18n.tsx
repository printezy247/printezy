import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { translations, type TranslationKey } from "./translations";
import { LOCALES, type Locale } from "./locale-constants";
export {
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  LOCALE_NATIVE_NAMES,
  LOCALE_TAGS,
} from "./locale-constants";
export type { Locale } from "./locale-constants";
export {
  localeFromPath,
  pageLocaleParam,
  routeLocaleFor,
  stripLocale,
  localizePath,
  switchedPath,
} from "./locale-routing";
import { routeLocaleFor, switchedPath } from "./locale-routing";

const RTL_LOCALES: Locale[] = ["ar"];

/** The locales that live behind a `/<locale>` prefix (everything but English). */
const PREFIXED = new Set<string>(LOCALES.filter((locale) => locale !== "en"));

const STORAGE_KEY = "pe_locale";

/**
 * Public pages with a real per-locale URL: `/x` (en) and `/<locale>/x` for the
 * five prefixed locales, see src/routes/$lang/*. On these paths the locale
 * follows the URL, not a stored preference — crawlers and the switcher both
 * need that. Routes not listed here (checkout, account, admin) keep the plain
 * client toggle.
 */
const LOCALIZED_PATHS = new Set([
  "/",
  "/home",
  "/faq",
  "/ezyai",
  "/indicators",
  "/macro",
  "/free-channel",
  "/privacy",
  "/terms",
]);
const LOCALIZED_PREFIXES = ["/ebooks/"];

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void };
const LocaleContext = createContext<LocaleContextValue>({ locale: "en", setLocale: () => {} });

/**
 * Persists the visitor's choice in localStorage for routes with no locale
 * URL of their own. Arabic flips `dir` to rtl so paragraphs and headings read
 * correctly via the browser's native bidi handling — layout (nav order, grids,
 * icon placement) intentionally stays left-to-right.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const routeLocale = routeLocaleFor(location.pathname);
  const [storedLocale, setStoredLocale] = useState<Locale>("en");

  // Read the stored preference once on mount, whatever the route. Reading it
  // only on non-localized paths made the locale flip mid-visit: a stored `ms`
  // was ignored on `/`, picked up on `/dashboard`, and then leaked back onto
  // `/` on the way home, so one page rendered in two languages depending on
  // how the visitor arrived at it.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Ignore a value this build no longer offers rather than render a
      // language with no keys behind it.
      if (stored && LOCALES.includes(stored as Locale)) setStoredLocale(stored as Locale);
    } catch {
      // Private browsing / storage blocked — default to English.
    }
  }, []);

  // A localized URL is an explicit statement of intent: `/ms/*` reads as Malay
  // for whoever opens a shared link, and an English URL stays English even if
  // this browser once picked Malay. Pages with no locale URL of their own fall
  // back to the stored choice.
  const locale = routeLocale ?? storedLocale;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = (next: Locale) => {
    // Record the pick before any navigation. en and ms used to return early
    // and store nothing, which left two holes: choosing English on an English
    // URL reloaded the same page and the previous preference won again, so
    // English became unreachable; and pages without a locale URL kept serving
    // whichever non-English language had last been stored.
    setStoredLocale(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-critical — the in-memory selection still works for this visit.
    }

    // Every offered locale has a URL, so move to the right one when we are not
    // already on it. Same-URL picks just re-render from the value above.
    const target = switchedPath(location.pathname, next);
    if (target && target !== location.pathname) {
      window.location.href = `${target}${location.searchStr}${location.hash ? `#${location.hash}` : ""}`;
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
