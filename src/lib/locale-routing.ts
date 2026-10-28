import { LOCALES, type Locale } from "./locale-constants";

const PREFIXED = new Set<string>(LOCALES.filter((locale) => locale !== "en"));
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

/** A `$lang` route param → locale. English has no prefix, so it returns undefined. */
export function pageLocaleParam(lang: string | undefined): Locale | undefined {
  return lang ? localeFromPath(`/${lang}`) : undefined;
}

export function routeLocaleFor(pathname: string): Locale | undefined {
  const fromUrl = localeFromPath(pathname);
  if (fromUrl) return fromUrl;
  if (
    LOCALIZED_PATHS.has(pathname) ||
    LOCALIZED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return "en";
  }
  return undefined;
}

/** The path with any leading locale prefix removed: `/zh/faq` → `/faq`. */
export function stripLocale(pathname: string): string {
  if (!localeFromPath(pathname)) return pathname;
  const rest = pathname.split("/").slice(2).join("/");
  return rest ? `/${rest}` : "/";
}

/** Add the requested locale prefix, preserving fragment identifiers. */
export function localizePath(path: string, locale: Locale): string {
  if (locale === "en") return path;
  const hashAt = path.indexOf("#");
  const bare = stripLocale(hashAt === -1 ? path : path.slice(0, hashAt));
  const hash = hashAt === -1 ? "" : path.slice(hashAt);
  const target = bare === "/" || bare === "/home" ? `/${locale}` : `/${locale}${bare}`;
  return `${target}${hash}`;
}

/** Return the localized twin path, or undefined when the route is not localized. */
export function switchedPath(pathname: string, next: Locale): string | undefined {
  const routeLocale = routeLocaleFor(pathname);
  if (!routeLocale) return undefined;
  const bare = stripLocale(pathname);
  if (next === "en") return bare === "/" && routeLocale !== "en" ? "/home" : bare;
  return localizePath(bare, next);
}
