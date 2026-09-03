import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Nav, Footer } from "@/components/landing/Landing";
import {
  requestTelegramLinkCode,
  getMyTelegramLinkStatus,
} from "@/lib/telegram-link.functions";

export const Route = createFileRoute("/_authenticated/link-telegram")({
  head: () => ({
    meta: [
      { title: "Connect Telegram | PrintEzy" },
      {
        name: "description",
        content: "Connect your Telegram account so purchases and access unlock automatically.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LinkTelegramPage,
});

function LinkTelegramPage() {
  const getStatus = useServerFn(getMyTelegramLinkStatus);
  const requestCode = useServerFn(requestTelegramLinkCode);

  const [linked, setLinked] = useState<boolean | null>(null);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      const status = await getStatus({ data: undefined });
      setLinked(status.linked);
      setTelegramUsername(status.telegramUsername);
    } catch {
      setError("Could not check your Telegram connection status.");
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  // Poll for a few seconds after a code is issued so the page updates itself
  // the moment the member taps the link and the bot links their account.
  useEffect(() => {
    if (!code || linked) return;
    const timer = setInterval(refreshStatus, 3000);
    return () => clearInterval(timer);
  }, [code, linked]);

  async function generateCode() {
    setBusy(true);
    setError(null);
    try {
      const result = await requestCode({ data: undefined });
      setCode(result.code);
      setDeepLink(result.deepLink);
    } catch {
      setError("Could not generate a code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto w-full max-w-md px-4 py-24">
        <h1 className="text-2xl font-semibold tracking-tight">Connect Telegram</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Link your Telegram account once so future purchases unlock automatically — no typing
          your handle at checkout.
        </p>

        {linked ? (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Telegram connected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {telegramUsername ? `Linked as @${telegramUsername}.` : "Your account is linked."}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {code && deepLink ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Your code (expires in 15 minutes)</p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-foreground">
                  {code}
                </p>
                <a
                  href={deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
                >
                  <Send className="h-4 w-4" /> Open Telegram to link
                </a>
                <p className="mt-2 text-xs text-muted-foreground">
                  This page updates itself automatically once you've tapped the link in Telegram.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void generateCode()}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Generating…" : "Generate my link code"}
              </button>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-[#d9534f]">{error}</p>}
      </main>
      <Footer />
    </div>
  );
}
