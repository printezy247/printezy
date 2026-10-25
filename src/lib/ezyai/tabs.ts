/**
 * Which tab the board opens on.
 *
 * The English board reads `?tab=` through its route's search schema; the
 * Malay board is a separate route and used to ignore the parameter entirely,
 * because the page looked the search up through the English route id. One
 * resolver keeps the two honest, and the page reads the URL directly so a
 * translated route needs no schema of its own to honour a shared link.
 */

export const EZYAI_TABS = ["live", "history", "about"] as const;

export type EzyAiTab = (typeof EZYAI_TABS)[number];

/** A tab the board knows, or `live` for a stale bookmark or a typo. */
export function resolveEzyAiTab(value: unknown): EzyAiTab {
  return EZYAI_TABS.find((tab) => tab === value) ?? "live";
}

/** The tab a location's search string asks for, defaulting to live. */
export function ezyAiTabFromSearch(searchStr: string): EzyAiTab {
  return resolveEzyAiTab(new URLSearchParams(searchStr).get("tab"));
}
