// Region-gated consent for ad measurement.
//
// Default is DENIED until a visitor in a regulated region accepts. Visitors
// outside those regions are not shown a banner and are measured normally.
// The region check reads the country client-side from Cloudflare's
// same-origin /cdn-cgi/trace and FAILS OPEN (shows the banner) on any doubt.

const STORAGE_KEY = "pe_ad_consent";

export type ConsentValue = "granted" | "denied";

/** EEA + UK + Switzerland + other consent/opt-out regimes we treat as regulated. */
const REGULATED = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO",
  "GB","CH","BR","ZA","KR","TH","JP","CA",
]);

const listeners = new Set<(v: ConsentValue | null) => void>();

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "granted" || raw === "denied" ? raw : null;
}

export function setConsent(value: ConsentValue) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, value);
  listeners.forEach((fn) => fn(value));
}

export function clearConsent() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((fn) => fn(null));
}

export function onConsentChange(fn: (v: ConsentValue | null) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let regionPromise: Promise<boolean> | null = null;

/** True when the visitor is in a region that requires consent. Fails open. */
export function isRegulatedRegion(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(true);
  if (regionPromise) return regionPromise;

  regionPromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 2000);
      const res = await fetch("/cdn-cgi/trace", { signal: controller.signal });
      window.clearTimeout(timer);
      if (!res.ok) return true;
      const loc = /(^|\n)loc=([A-Z0-9]{2})/.exec(await res.text())?.[2];
      if (!loc || loc === "XX" || loc === "T1") return true;
      return REGULATED.has(loc);
    } catch {
      return true;
    }
  })();

  return regionPromise;
}

/**
 * May we report ad measurement for this visitor right now?
 * Outside regulated regions: always. Inside: only after an explicit accept.
 */
export async function hasAdConsent(): Promise<boolean> {
  const stored = getStoredConsent();
  if (stored) return stored === "granted";
  return !(await isRegulatedRegion());
}
