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

export function trackPageLoad(name = "landing") {
  track("page_load", name);
}

/**
 * Fire an "engaged" event once the visitor either stays 15s or scrolls
 * past 50% of the document. Also emit scroll-depth milestones. These
 * secondary events make analytics count the session as non-bounce
 * (any session with 2+ events isn't a bounce in most tools).
 */
export function trackEngagement() {
  if (typeof window === "undefined") return;

  let engaged = false;
  const fireEngaged = (source: string) => {
    if (engaged) return;
    engaged = true;
    track("section_view", `engaged_${source}`);
    window.clearTimeout(timer);
    window.removeEventListener("scroll", onScroll);
  };

  const timer = window.setTimeout(() => fireEngaged("15s"), 15000);

  const depthHits = new Set<number>();
  const onScroll = () => {
    const doc = document.documentElement;
    const scrolled = window.scrollY + window.innerHeight;
    const height = Math.max(doc.scrollHeight, 1);
    const pct = Math.round((scrolled / height) * 100);
    [25, 50, 75, 90].forEach((m) => {
      if (pct >= m && !depthHits.has(m)) {
        depthHits.add(m);
        track("section_view", `scroll_${m}`);
        if (m >= 50) fireEngaged("scroll");
      }
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("scroll", onScroll);
  };
}
