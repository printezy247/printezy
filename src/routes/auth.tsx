import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/landing/Landing";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create your account | EzyMap ALGO" },
      {
        name: "description",
        content:
          "Sign in to see your EzyMap ALGO purchases, access status and Telegram claim codes — or create an account in seconds.",
      },
      { property: "og:title", content: "Sign in or create your account | EzyMap ALGO" },
      {
        property: "og:description",
        content: "Track your EzyMap ALGO purchases and access from one account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  component: AuthPage,
});

const safePath = (value: string | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/my-account";

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: safePath(search.redirect), replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate, search.redirect]);

  async function googleSignIn() {
    setError(null);
    try {
      const { lovable } = await import("@/integrations/lovable");
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  async function resetPassword() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email first, then tap reset.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (resetError) setError(resetError.message);
    else setNotice("Password reset link sent — check your inbox.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Account created. Check your email to confirm it, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      navigate({ to: safePath(search.redirect), replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto w-full max-w-md px-4 py-24">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Access your purchases, access status and Telegram claim codes."
            : "One account keeps every package you buy, so access is never lost."}
        </p>

        <button
          type="button"
          onClick={googleSignIn}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-elevated"
        >
          Continue with Google
        </button>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <label htmlFor="email" className="text-sm text-muted-foreground">
            Email
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
          <label htmlFor="password" className="text-sm text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="••••••••"
          />
          <button
            type="submit"
            disabled={busy || email.length === 0 || password.length < 8}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          {error && <p className="text-sm text-[#d9534f]">{error}</p>}
          {notice && <p className="text-sm text-[#2fbf71]">{notice}</p>}
        </form>
        {mode === "signin" ? (
          <button
            type="button"
            onClick={resetPassword}
            className="mt-4 text-sm text-muted-foreground underline underline-offset-4"
          >
            Forgot your password?
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="mt-5 text-sm text-muted-foreground underline underline-offset-4"
        >
          {mode === "signin" ? "Create an account" : "Back to sign in"}
        </button>
      </main>
      <Footer />
    </div>
  );
}
