import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { Nav, Footer } from "@/components/landing/Landing";
import {
  getTelegramLoginConfig,
  signInWithTelegramToWebsite,
} from "@/lib/telegram-login.functions";
import { TelegramLoginButton, type TelegramAuthPayload } from "@/components/TelegramLoginButton";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — EzyMap ALGO" },
      {
        name: "description",
        content:
          "Sign in to your EzyMap ALGO account to see your purchases, ebooks and referral link.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Sign in — EzyMap ALGO" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  component: AuthPage,
});

/** Only same-origin paths may be used as a post-login destination. */
export const safePath = (value: string | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const destination = safePath(search.redirect);

  const loadTelegramConfig = useServerFn(getTelegramLoginConfig);
  const telegramSignIn = useServerFn(signInWithTelegramToWebsite);

  useEffect(() => {
    let alive = true;
    void loadTelegramConfig()
      .then((res) => alive && setBotUsername(res.botUsername))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [loadTelegramConfig]);

  // Telegram issues no email, and website accounts are keyed on one, so this
  // never creates an account. A linked Telegram opens the website account it
  // is linked to; an unlinked one opens the member area, which is keyed on
  // Telegram in the first place.
  async function signInWithTelegramAccount(payload: TelegramAuthPayload) {
    setTelegramBusy(true);
    setError(null);
    try {
      const res = await telegramSignIn({ data: payload });
      if (!res.ok) {
        setError(res.message);
        setTelegramBusy(false);
        return;
      }
      if (res.mode === "website") {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: res.tokenHash,
          type: "magiclink",
        });
        if (otpError) throw otpError;
        window.location.replace(destination);
        return;
      }
      // The member area consumes a token from the query string and clears it.
      window.location.replace(`/account?s=${encodeURIComponent(res.token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth_error_generic"));
      setTelegramBusy(false);
    }
  }

  // Already signed in (or just returned from a magic link / Google): move on.
  // destination may carry a query string (e.g. /ebooks/x?claim=1), so use a
  // plain location replace rather than the typed router navigate.
  useEffect(() => {
    let active = true;
    const go = () => window.location.replace(destination);
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) go();
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) go();
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [destination]);

  async function signInWithGoogle() {
    setGoogleBusy(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + destination },
      });
      if (oauthError) throw oauthError;
      // The browser is now being redirected to Google.
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth_error_generic"));
      setGoogleBusy(false);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (state !== "idle") return;
    setState("sending");
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + destination },
    });
    if (otpError) {
      setError(otpError.message || t("auth_error_generic"));
      setState("idle");
      return;
    }
    setState("sent");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto w-full max-w-md px-4 py-24">
        <h1 className="text-2xl tracking-tight">{t("auth_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth_subtitle")}</p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleBusy || state === "sending"}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-elevated disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.63H1.29A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.29 5.37l3.98-3.09z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
            />
          </svg>
          {googleBusy ? t("auth_google_busy") : t("auth_google")}
        </button>

        {botUsername ? (
          <div className="mt-4">
            <TelegramLoginButton
              botUsername={botUsername}
              onAuth={signInWithTelegramAccount}
              onUnavailable={() => setBotUsername(null)}
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {telegramBusy ? t("auth_sending") : t("auth_telegram_hint")}
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("auth_or")}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {state === "sent" ? (
          <div className="mt-5 rounded-md border border-primary/30 bg-primary/8 p-4 text-sm text-body">
            <Mail className="mb-2 h-5 w-5 text-primary" />
            {t("auth_link_sent").replace("{email}", email.trim())}
          </div>
        ) : (
          <form onSubmit={sendMagicLink} className="mt-5 flex flex-col gap-3">
            <label htmlFor="email" className="text-sm text-muted-foreground">
              {t("auth_email_label")}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
            <button
              type="submit"
              disabled={state === "sending" || email.trim().length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {state === "sending" ? t("auth_sending") : t("auth_send_link")}
            </button>
            <p className="text-xs text-muted-foreground">{t("auth_no_password")}</p>
          </form>
        )}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </main>
      <Footer />
    </div>
  );
}
