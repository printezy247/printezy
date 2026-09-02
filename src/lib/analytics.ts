import { recordEvent } from "./analytics.functions";
import { recordAdClick } from "./adclick.functions";
import { reportSiteMetaEvent } from "./metaevent.functions";
import { hasAdConsent, onConsentChange } from "./consent";

export type AnalyticsEventType = "click" | "section_view" | "page_load";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "pe_analytics_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

/**
 * Capture Meta ad-click attribution (fbclid + utm tags) from the current URL,
 * keyed by the same sessionId used for every other analytics event so the
 * Telegram bot can resolve the fbclid from the short `?start=<sessionId>` tag.
 */
export function trackAdClick() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  if (!fbclid) return;

  recordAdClick({
    data: {
      sessionId: getSessionId(),
      fbclid,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      landingPath: window.location.pathname,
    },
  }).catch(() => {
    // Silent fail: attribution should never break the landing page.
  });
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


/* ------------------------------------------------------------------ */
/* Meta conversions fired from the site itself                         */
/* ------------------------------------------------------------------ */

export type SiteMetaEvent =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "InitiateCheckout"
  | "StartTrial";

type QueuedEvent = {
  eventName: SiteMetaEvent;
  eventId: string;
  contentName?: string;
  contentId?: string;
  valueCents?: number;
};

// Events raised before a regulated-region visitor has decided are held here,
// then flushed if (and only if) they accept.
const pending: QueuedEvent[] = [];
let listening = false;

function readFbp(): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1] ?? null;
}

function send(event: QueuedEvent) {
  reportSiteMetaEvent({
    data: {
      eventName: event.eventName,
      sessionId: getSessionId(),
      eventId: event.eventId,
      path: typeof window !== "undefined" ? window.location.pathname : "/",
      contentName: event.contentName ?? null,
      contentId: event.contentId ?? null,
      valueCents: event.valueCents ?? null,
      fbp: readFbp(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    },
  }).catch(() => {
    // Silent fail: ad reporting must never break the page.
  });
}

/** Report a conversion, gated on consent in the regions that require it. */
export function metaTrack(
  eventName: SiteMetaEvent,
  opts: { id?: string; contentName?: string; contentId?: string; valueCents?: number } = {},
) {
  if (typeof window === "undefined") return;
  const event: QueuedEvent = {
    eventName,
    eventId: `site_${eventName}_${getSessionId()}_${opts.id ?? "1"}`,
    contentName: opts.contentName,
    contentId: opts.contentId,
    valueCents: opts.valueCents,
  };

  hasAdConsent().then((allowed) => {
    if (allowed) {
      send(event);
      return;
    }
    pending.push(event);
    if (!listening) {
      listening = true;
      onConsentChange((value) => {
        if (value === "granted") {
          while (pending.length) send(pending.shift()!);
        } else if (value === "denied") {
          pending.length = 0;
        }
      });
    }
  });
}
