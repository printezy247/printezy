// Shared, client-safe enrollment tier catalogue.
// Used by the Telegram bot, the Stripe checkout builder and the account portal.

export const SITE_URL = "https://printezy.money";

export type TierId = "free" | "vantage" | "beginner" | "pro" | "premium" | "elite";

/** Broker partner link that unlocks the no-payment trial tier. */
export const VANTAGE_LINK =
  "https://www.vantagemarketsea.com/ms/open-live-account/?affid=MjY0NjgwMDg%3D&invitecode=oQQlQ8yM";

/** Days of Pro-level access granted after a Vantage activation. */
export const VANTAGE_TRIAL_DAYS = 30;

export type TierConfig = {
  id: TierId;
  name: string;
  blurb: string;
  amountCents: number;
  perks: string[];
};

export const TIER_CATALOG: TierConfig[] = [
  {
    id: "free",
    name: "Free",
    blurb: "Community access, no payment required",
    amountCents: 0,
    perks: ["Public channel access", "Daily education", "Weekly market recap"],
  },
  {
    id: "beginner",
    name: "Beginner",
    blurb: "Foundations + guided routines",
    amountCents: 2900,
    perks: ["Beginner ebooks", "Routine templates", "Community Q&A"],
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "Scalp mastery routines",
    amountCents: 4900,
    perks: ["M5 scalping playbook", "Real-time alerts", "Pro chat access"],
  },
  {
    id: "premium",
    name: "Premium",
    blurb: "Intraday + swing routines",
    amountCents: 9900,
    perks: ["All Pro perks", "Intraday & swing setups", "TradingView indicators"],
  },
  {
    id: "elite",
    name: "Elite",
    blurb: "Full desk access & mentoring",
    amountCents: 29900,
    perks: ["All Premium perks", "MT5 indicators", "1:1 mentoring sessions"],
  },
];

export function getTier(id: string): TierConfig | undefined {
  return TIER_CATALOG.find((t) => t.id === id);
}

export function formatPrice(amountCents: number, currency = "usd"): string {
  if (amountCents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amountCents / 100);
}
