/**
 * Site copy in six locales (en/ms/zh/hi/ar/sw). `TranslationKey` is derived
 * from the `en` block, so every locale block must carry the same key set —
 * adding a key means adding it to all six (src/lib/translations/<locale>.ts)
 * before wiring `t()` for it.
 *
 * Only English ships in the entry bundle. The other five are separate chunks:
 * - the server loads all of them before it serves a request;
 * - the browser loads the locale named by the URL before it hydrates, so the
 *   first paint matches the server HTML;
 * - a locale picked later (stored preference) is fetched by `loadLocale`.
 * Until a locale has loaded, `translations[locale]` is English, never empty.
 */
import en from "./translations/en";
import type { Locale } from "./i18n";

export type TranslationKey = keyof typeof en;
type Dict = Record<TranslationKey, string>;

const loaders: Record<Exclude<Locale, "en">, () => Promise<{ default: Dict }>> = {
  ms: () => import("./translations/ms"),
  zh: () => import("./translations/zh"),
  hi: () => import("./translations/hi"),
  ar: () => import("./translations/ar"),
  sw: () => import("./translations/sw"),
};

const loaded: Partial<Record<Locale, Dict>> = { en };
const pending: Partial<Record<Locale, Promise<void>>> = {};

/** Fetch a locale's copy once; resolves when `translations[locale]` is real. */
export function loadLocale(locale: Locale): Promise<void> {
  if (locale === "en" || loaded[locale]) return Promise.resolve();
  pending[locale] ??= loaders[locale]().then((m) => {
    loaded[locale] = m.default;
  });
  return pending[locale]!;
}

export function isLocaleLoaded(locale: Locale): boolean {
  return Boolean(loaded[locale]);
}

export function loadAllLocales(): Promise<void> {
  return Promise.all((Object.keys(loaders) as Locale[]).map(loadLocale)).then(() => undefined);
}

export const translations: Record<Locale, Dict> = {
  en,
  get ms() {
    return loaded.ms ?? en;
  },
  get zh() {
    return loaded.zh ?? en;
  },
  get hi() {
    return loaded.hi ?? en;
  },
  get ar() {
    return loaded.ar ?? en;
  },
  get sw() {
    return loaded.sw ?? en;
  },
};

// Server and tests need every locale synchronously; the browser only needs
// the one in the URL before hydration.
if (typeof window === "undefined" || import.meta.env.MODE === "test") {
  await loadAllLocales();
} else {
  const first = window.location.pathname.split("/")[1] as Locale;
  if (first in loaders) await loadLocale(first);
}
