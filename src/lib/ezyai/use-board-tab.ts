import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { ezyAiTabFromSearch, type EzyAiTab } from "./tabs";

/**
 * The selected board tab, kept in step with `?tab=`.
 *
 * Neither board route declares a search schema, and `/xx/ezyai` is a different
 * route anyway, so the URL is the one source every locale shares. The panel and
 * the address bar move together: without the write-back the tab changed but
 * `?tab=` did not, so a reload — or a link copied from the bar — snapped back
 * to whatever the URL said.
 */
export function useBoardTab() {
  const { searchStr, pathname } = useLocation();
  const [tab, setTab] = useState<EzyAiTab>(() => ezyAiTabFromSearch(searchStr));

  const selectTab = (next: EzyAiTab) => {
    setTab(next);
    const params = new URLSearchParams(searchStr);
    params.set("tab", next);
    const query = params.toString();
    // replaceState, not push: switching tabs is not a navigation the back
    // button should have to walk through.
    window.history.replaceState(
      window.history.state,
      "",
      `${pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  };

  // A back/forward jump or a hand-edited URL is authoritative: follow it.
  useEffect(() => {
    setTab(ezyAiTabFromSearch(searchStr));
  }, [searchStr]);

  return { tab, selectTab };
}
