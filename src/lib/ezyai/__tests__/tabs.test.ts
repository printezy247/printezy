import { describe, it, expect } from "vitest";
import { EZYAI_TABS, ezyAiTabFromSearch, resolveEzyAiTab } from "../tabs";

/**
 * Deep-linkable tabs: `/ezyai?tab=history` and `/ms/ezyai?tab=history` both
 * open the history tab, and anything unrecognised opens live instead of an
 * empty page — without a redirect, on either board. The rule lives here, one
 * list and one fallback, and the page reads the URL through it and writes the
 * selected tab back with replaceState.
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
