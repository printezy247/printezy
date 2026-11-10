import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronDown, LogIn, Menu, Send, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { imgProps } from "@/lib/responsive-images";
import { getTicker } from "@/lib/ticker.functions";
import { EZYAI_BOARD_VISIBLE } from "@/lib/ezyai/visibility";
import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS, LOCALE_NATIVE_NAMES } from "@/lib/locale-constants";
import { localizePath, useLocale, useTranslation } from "@/lib/i18n";
import { getSessionId, goTrack } from "@/lib/analytics";
import { LINKS } from "@/lib/links";

/**
 * The site chrome every page wears: the ticker strip, the header nav and the
 * footer. It lives outside Landing.tsx on purpose — routes import this module
 * directly, so opening /ezyai or /macro no longer loads the entire marketing
 * page (and framer-motion, and Supabase) just to draw the header.
 */

const brandLogo = "/__l5e/assets-v1/1d73bbe2-5c3b-4399-8e48-1eace4a5ed77/ezymap-logo.png";

/**
 * Bot links carry `?start=<sessionId>` so the Telegram bot can look the
 * visitor's fbclid back up. sessionId only exists client-side, so render the
 * plain href on first paint and swap it in after mount (no hydration mismatch).
 */
export function useBotLink() {
  const [href, setHref] = useState(LINKS.bot);
  useEffect(() => {
    setHref(`${LINKS.bot}?start=${encodeURIComponent(getSessionId())}`);
  }, []);
  return href;
}

function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        {...imgProps(brandLogo)}
        alt="EzyMap Algo logo"
        className="h-8 w-8 rounded-md object-contain"
      />
      <span className="font-display text-[17px] font-bold tracking-tight text-foreground">
        EzyMap<span className="text-accent">Algo</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Market ticker (static reference quotes)                             */
/* ------------------------------------------------------------------ */

/**
 * The symbols the header shows, in order. Prices come from the live feed; this
 * list only decides what is asked for and how it is ordered.
 *
 * Until the feed answers, each row shows its symbol and a dash. It previously
 * showed fifteen hardcoded prices — real-looking numbers that had not moved
 * since the day they were typed — and a placeholder that admits it is a
 * placeholder is worth more than one that lies convincingly.
 */
const TICKER_SYMBOLS = [
  "XAU/USD",
  "XAG/USD",
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CAD",
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
  "US30",
  "US500",
  "NAS100",
  "USOIL",
  "UKOIL",
];

export function Ticker() {
  const loadTicker = useServerFn(getTicker);
  // Fetched after mount, never during render: this bar sits on every page, and
  // a header that waits on a market feed is a site that waits on a market feed.
  const { data } = useQuery({
    queryKey: ["header-ticker"],
    queryFn: () => loadTicker(),
    refetchInterval: 60_000,
    staleTime: 55_000,
  });

  const quotes = data?.quotes ?? [];
  const rows = quotes.length
    ? quotes
    : TICKER_SYMBOLS.map((symbol) => ({ symbol, price: "—", change: "", up: true }));
  // Doubled so the marquee can loop without a visible seam. The second copy
  // exists only for the animation, so it is hidden from assistive tech —
  // otherwise the strip is announced twice on every page.
  const items = [...rows, ...rows];

  return (
    <div
      role="region"
      aria-label="Market prices"
      className="w-full border-b border-border bg-surface-elevated text-foreground"
    >
      <div className="ticker-wrap mx-auto max-w-6xl px-4 py-1.5 text-[12.5px] sm:px-6 lg:px-8">
        <div className="ticker-track animate-ticker gap-8">
          {items.map((t, i) => (
            <span
              key={`${t.symbol}-${i}`}
              aria-hidden={i >= rows.length ? true : undefined}
              className="flex shrink-0 items-baseline gap-1.5"
            >
              <span className="font-semibold text-body">{t.symbol}</span>
              <span className="font-mono tabular-nums text-foreground">{t.price}</span>
              {t.change ? (
                <span
                  className="font-mono tabular-nums font-semibold"
                  style={{ color: t.up ? "var(--market-up)" : "var(--market-down)" }}
                >
                  {t.change}
                </span>
              ) : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { key: "nav_signals", href: "/home#features" },
  { key: "nav_packages", href: "/home#packages" },
  { key: "nav_tools", href: "/home#tools" },
  { key: "nav_macro", href: "/macro" },
  // The board's nav item comes and goes with the board itself, rather than
  // being deleted — see src/lib/ezyai/visibility.ts.
  ...(EZYAI_BOARD_VISIBLE ? ([{ key: "nav_ezyai", href: "/ezyai" }] as const) : []),
] as const;

/** Not in the header nav — footer-only wayfinding links. */
const FOOTER_ONLY_ITEMS = [
  { key: "footer_track_record", href: "/home#track-record" },
  { key: "footer_faq", href: "/faq" },
] as const;

function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-body transition-colors hover:bg-surface"
      >
        <span aria-hidden="true">{LOCALE_FLAGS[locale]}</span>
        {LOCALE_LABELS[locale]}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-elevated"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={locale === l}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  locale === l ? "bg-primary-tint text-primary" : "text-body hover:bg-surface"
                }`}
              >
                <span aria-hidden="true">{LOCALE_FLAGS[l]}</span>
                <span className="flex-1">{LOCALE_NATIVE_NAMES[l]}</span>
                {locale === l ? <Check className="h-3.5 w-3.5" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * "Sign in" for visitors, "My account" once a Supabase session exists.
 * Client-only: renders an empty placeholder until the session is known so
 * SSR and the first client paint agree.
 *
 * Supabase is imported on mount rather than at module scope. The auth-js and
 * storage-js bundles are bigger than the rest of the header put together, and
 * every page loads the header — so they arrive after first paint, in their own
 * chunk, and a failed load degrades to "Sign in" instead of breaking the page.
 */
function AuthMenu({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const [state, setState] = useState<"unknown" | "out" | "in">("unknown");

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        if (!active) return;
        const { data } = await supabase.auth.getSession();
        if (active) setState(data.session ? "in" : "out");
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (active) setState(session ? "in" : "out");
        });
        unsubscribe = () => subscription.unsubscribe();
      } catch {
        // No auth backend reachable: offer the sign-in page rather than a
        // header that never finishes rendering.
        if (active) setState("out");
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  if (state === "unknown") {
    return <span aria-hidden="true" className={mobile ? "block h-11" : "inline-block h-8 w-16"} />;
  }
  const redirect = typeof window !== "undefined" ? window.location.pathname : "/";
  return (
    <Button
      asChild
      variant="ghost"
      size={mobile ? "md" : "sm"}
      className={mobile ? "w-full justify-start" : ""}
    >
      {state === "in" ? (
        <Link to="/dashboard" onClick={onNavigate}>
          <UserRound className="h-4 w-4" /> {t("nav_my_account")}
        </Link>
      ) : (
        <Link to="/auth" search={{ redirect }} onClick={onNavigate}>
          <LogIn className="h-4 w-4" /> {t("nav_sign_in")}
        </Link>
      )}
    </Button>
  );
}

export function Nav() {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    toggleBtnRef.current?.focus();
  }, []);

  // Body scroll lock, focus trap, Escape-to-close and click-outside-to-dismiss
  // while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !menuRef.current) return;
      const focusable = menuRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !toggleBtnRef.current?.contains(target)
      ) {
        closeMenu();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, closeMenu]);

  return (
    <>
      <Ticker />
      <header role="banner" className="sticky top-0 z-50 bg-background">
        <nav className="border-b border-border">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <a href={localizePath("/", locale)} aria-label="EzyMap Algo home">
              <Logo />
            </a>

            <ul className="hidden items-center gap-6 lg:flex">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={localizePath(item.href, locale)}
                    className="flex min-h-11 items-center text-sm font-medium text-body transition-colors hover:text-primary"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden items-center gap-4 lg:flex">
              <LocaleSwitcher />
              <AuthMenu />
              <Button asChild variant="outline" size="sm">
                <a href={LINKS.support} onClick={() => goTrack("nav_ask_sarah")}>
                  <Send className="h-4 w-4" /> {t("nav_ask_sarah")}
                </a>
              </Button>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <LocaleSwitcher />
              <button
                ref={toggleBtnRef}
                type="button"
                aria-label={t("nav_toggle_menu")}
                aria-expanded={open}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </nav>

        {open ? (
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav_site_menu")}
            className="border-b border-border bg-background lg:hidden"
          >
            <ul className="space-y-1 px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={localizePath(item.href, locale)}
                    onClick={closeMenu}
                    className="flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-body hover:bg-surface"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <AuthMenu mobile onNavigate={closeMenu} />
              </li>
              <li className="pt-2">
                <Button asChild variant="outline" size="md" className="w-full">
                  <a href={LINKS.support} onClick={() => goTrack("nav_ask_sarah_mobile")}>
                    <Send className="h-4 w-4" /> {t("nav_ask_sarah")}
                  </a>
                </Button>
              </li>
            </ul>
          </div>
        ) : null}
      </header>
    </>
  );
}

export function Footer() {
  const botHref = useBotLink();
  const { t, locale } = useTranslation();
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("footer_tagline")}</p>
            <a
              href={LINKS.freeChannel}
              onClick={() => goTrack("footer_telegram")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-glow"
            >
              <Send className="h-4 w-4" /> t.me/ezymap
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer_navigate")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[...NAV_ITEMS, ...FOOTER_ONLY_ITEMS].map((i) => (
                <li key={i.href}>
                  <a href={localizePath(i.href, locale)} className="hover:text-foreground">
                    {t(i.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer_links")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={botHref}
                  onClick={() => goTrack("footer_bot")}
                  className="hover:text-foreground"
                >
                  {t("footer_enrollment_bot")}
                </a>
              </li>
              <li>
                <a
                  href={LINKS.support}
                  onClick={() => goTrack("footer_support")}
                  className="hover:text-foreground"
                >
                  {t("footer_support")}
                </a>
              </li>
              <li>
                <a
                  href={LINKS.macro}
                  onClick={() => goTrack("footer_macro")}
                  className="hover:text-foreground"
                >
                  {t("footer_macro_fundamentals")}
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-foreground">
                  {t("nav_my_account")}
                </Link>
              </li>
              <li>
                <a
                  href={LINKS.vantage}
                  onClick={() => goTrack("footer_vantage")}
                  className="hover:text-foreground"
                >
                  {t("footer_vantage_markets")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer_legal")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={localizePath("/privacy", locale)} className="hover:text-foreground">
                  {t("footer_privacy")}
                </a>
              </li>
              <li>
                <a href={localizePath("/terms", locale)} className="hover:text-foreground">
                  {t("footer_terms")}
                </a>
              </li>
              <li>
                <a
                  href={LINKS.support}
                  onClick={() => goTrack("footer_contact")}
                  className="hover:text-foreground"
                >
                  {t("footer_contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>{t("footer_copyright")}</p>
          <p>{t("footer_risk_disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
