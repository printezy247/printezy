const STORAGE_KEY = "pe_referral_code";

/** Capture ?ref=CODE from the URL once, kept long-lived (unlike the session id). */
export function captureReferralCode() {
  if (typeof window === "undefined") return;
  const code = new URLSearchParams(window.location.search).get("ref");
  if (!code) return;
  try {
    localStorage.setItem(STORAGE_KEY, code.toUpperCase().slice(0, 16));
  } catch {
    // Storage can be unavailable (private mode); attribution is best-effort.
  }
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
