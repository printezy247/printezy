import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { translations, type TranslationKey } from "./translations";

export type Locale = "en" | "ms" | "zh" | "hi" | "ar" | "sw";

// Every locale has a full key set in `translations`, so all six are offered.
// English is the unprefixed one; each of the others owns a `/<locale>` prefix.
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

/** `/ms/faq` → `ms`; `/fr/faq` → undefined. */
export function localeFromPath(pathname: string): Locale | undefined {
  const segment = pathname.split("/")[1] ?? "";
  return PREFIXED.has(segment) ? (segment as Locale) : undefined;
}

/**
 * A `$lang` route param → locale. Undefined for `en` (which has no prefix) and
 * for anything the site does not serve, so `/<lang>/faq` can 404 rather than
 * render English behind a foreign URL.
 */
export function pageLocaleParam(lang: string | undefined): Locale | undefined {
  return lang ? localeFromPath(`/${lang}`) : undefined;
}

export function routeLocaleFor(pathname: string): Locale | undefined {
  const fromUrl = localeFromPath(pathname);
  if (fromUrl) return fromUrl;
  if (LOCALIZED_PATHS.has(pathname) || LOCALIZED_PREFIXES.some((p) => pathname.startsWith(p)))
    return "en";
  return undefined;
}

/** The path with any leading locale prefix removed: `/zh/faq` → `/faq`. */
export function stripLocale(pathname: string): string {
  if (!localeFromPath(pathname)) return pathname;
  const rest = pathname.split("/").slice(2).join("/");
  return rest ? `/${rest}` : "/";
}

/**
 * `/faq` → `/zh/faq`, `/` (and `/home`) → `/zh`, `/#packages` → `/zh#packages`;
 * unchanged for en. A path that already carries a locale prefix is re-prefixed
 * rather than doubled, so a caller may pass either shape.
 */
export function localizePath(path: string, locale: Locale): string {
  if (locale === "en") return path;
  const hashAt = path.indexOf("#");
  const bare = stripLocale(hashAt === -1 ? path : path.slice(0, hashAt));
  const hash = hashAt === -1 ? "" : path.slice(hashAt);
  const target = bare === "/" || bare === "/home" ? `/${locale}` : `/${locale}${bare}`;
  return `${target}${hash}`;
}

/**
 * Where picking `next` should take the visitor, from the path they are on.
 * Undefined when the page has no locale URL of its own (checkout, account,
 * admin) — there the choice only applies to this visit.
 *
 * `/xx` is the twin of `/home` (the landing page), while `/` is the
 * English-only welcome page, so leaving a localized landing for English has to
 * land on `/home` rather than on a different page entirely.
 */
export function switchedPath(pathname: string, next: Locale): string | undefined {
  const routeLocale = routeLocaleFor(pathname);
  if (!routeLocale) return undefined;
  const bare = stripLocale(pathname);
  if (next === "en") return bare === "/" && routeLocale !== "en" ? "/home" : bare;
  return localizePath(bare, next);
}

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
