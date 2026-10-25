import { describe, it, expect } from "vitest";
import { EZYAI_TABS, ezyAiTabFromSearch, resolveEzyAiTab } from "../tabs";

/**
 * Deep-linkable tabs are the English board's behaviour: `/ezyai?tab=history`
 * opens the history tab, and anything unrecognised opens live instead of an
 * empty page. The Malay board reads the same links but on its own route, so
 * the rule lives here — one list, one fallback — and the page reads the URL
 * through it.
 */

describe("resolveEzyAiTab", () => {
  it("keeps every tab the board has", () => {
    for (const tab of EZYAI_TABS) expect(resolveEzyAiTab(tab)).toBe(tab);
  });

  it("falls back to live for anything else", () => {
    // A stale bookmark, a typo, or an attacker's guess is a tab that does not
    // exist — the board opens on live rather than an empty panel.
    for (const junk of [undefined, null, "", "HISTORY", "history ", "junk", 0, {}]) {
      expect(resolveEzyAiTab(junk)).toBe("live");
    }
  });
});

describe("ezyAiTabFromSearch", () => {
  it("reads the tab out of a location search string", () => {
    expect(ezyAiTabFromSearch("?tab=history")).toBe("history");
    expect(ezyAiTabFromSearch("?tab=about&utm_source=telegram")).toBe("about");
  });

  it("defaults to live on an empty or unrelated query", () => {
    expect(ezyAiTabFromSearch("")).toBe("live");
    expect(ezyAiTabFromSearch("?utm_source=telegram")).toBe("live");
    expect(ezyAiTabFromSearch("?tab=junk")).toBe("live");
    expect(ezyAiTabFromSearch("?tab=")).toBe("live");
  });
});
