import { recordEvent } from "./analytics.functions";

export type AnalyticsEventType = "click" | "section_view" | "page_load";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "pe_analytics_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getContext() {
  return {
    path: typeof window !== "undefined" ? window.location.pathname : "/",
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    sessionId: getSessionId(),
  };
}

export function track(eventType: AnalyticsEventType, eventName: string) {
  const ctx = getContext();
  recordEvent({ data: { eventType, eventName, ...ctx } }).catch(() => {
    // Silent fail: analytics should never break the landing page.
  });
}



export function trackSectionVisibility(sectionIds: string[]) {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

  const seen = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !seen.has(entry.target.id)) {
          seen.add(entry.target.id);
          track("section_view", entry.target.id);
        }
      });
    },
    { threshold: 0.5 },
  );

  sectionIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  return () => observer.disconnect();
}

export function trackPageLoad() {
  track("page_load", "landing");
}
