/**
 * Which tab the board opens on.
 *
 * Both boards read `?tab=` from the URL through this one resolver. Neither
 * route declares a search schema: a schema could only rewrite what the
 * visitor's link said (a stale tab used to be dropped with a redirect on the
 * English board and kept on the Malay one), and the page already knows how to
 * fall back to live without moving anyone off their URL.
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
