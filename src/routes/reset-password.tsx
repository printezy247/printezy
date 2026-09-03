import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/landing/Landing";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password | EzyMap ALGO" },
      {
        name: "description",
        content: "Choose a new password for your EzyMap ALGO account and get back to your purchases.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Set a new password | EzyMap ALGO" },
      { property: "og:description", content: "Choose a new password for your EzyMap ALGO account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    navigate({ to: "/my-account", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto w-full max-w-md px-4 py-24">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <label htmlFor="password" className="text-sm text-muted-foreground">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="••••••••"
          />
          <button
            type="submit"
            disabled={busy || password.length < 8}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save password"}
          </button>
          {error && <p className="text-sm text-[#d9534f]">{error}</p>}
        </form>
      </main>
      <Footer />
    </div>
  );
}
