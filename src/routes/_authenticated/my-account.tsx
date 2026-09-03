import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Copy, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Nav, Footer } from "@/components/landing/Landing";
import { getMyPurchases } from "@/lib/my-account.functions";
import { getCatalogItem, formatUsd } from "@/lib/catalog";
import { REGISTER_BOT } from "@/lib/telegram-links";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

export const Route = createFileRoute("/_authenticated/my-account")({
  head: () => ({
    meta: [
      { title: "My account — purchases & access | EzyMap ALGO" },
      {
        name: "description",
        content:
          "See every EzyMap ALGO package you own, your Telegram access status, and re-claim access with your one-time code.",
      },
      { property: "og:title", content: "My account — purchases & access" },
      {
        property: "og:description",
        content: "Your EzyMap ALGO purchases, access status and Telegram claim codes in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyAccountPage,
});

const botBase = `https://t.me/${REGISTER_BOT.replace(/^@/, "")}`;

function MyAccountPage() {
  const fetchPurchases = useServerFn(getMyPurchases);
  const { user } = useSupabaseUser();
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-purchases"],
    queryFn: () => fetchPurchases({ data: undefined }),
  });

  const purchases = data ?? [];

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">My account</h1>
          <p className="mt-2 text-sm text-muted">{user?.email}</p>
        </header>

        <section className="mt-10">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted">
            Your packages
          </h2>

          {isLoading ? (
            <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted" />
          ) : purchases.length === 0 ? (
            <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-elevated p-6 text-center">
              <p className="text-sm text-body">No purchases on this account yet.</p>
              <Link
                to="/pricing"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Browse packages
              </Link>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-4">
              {purchases.map((p) => {
                const item = getCatalogItem(p.sku);
                const granted = Boolean(p.granted_at);
                return (
                  <article
                    key={p.id}
                    className="w-full max-w-xl rounded-xl border border-border bg-elevated p-5 text-left"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {item?.name ?? p.sku}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {formatUsd(p.amount_cents)} ·{" "}
                          {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          granted
                            ? "bg-primary/15 text-primary"
                            : "border border-[rgba(201,161,58,0.45)] text-accent"
                        }`}
                      >
                        {granted ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5" /> Claim pending
                          </>
                        )}
                      </span>
                    </div>

                    {!granted && p.claim_code ? (
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-bold tracking-widest text-accent">
                              {p.claim_code}
                            </code>
                            <button
                              type="button"
                              onClick={() => copy(p.claim_code!)}
                              aria-label="Copy claim code"
                              className="rounded-md border border-border p-1.5 text-muted hover:text-foreground"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            {copied === p.claim_code ? (
                              <span className="text-xs text-muted">Copied</span>
                            ) : null}
                          </div>
                          <a
                            href={`${botBase}?start=${p.claim_code}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                          >
                            <Send className="h-4 w-4" /> Claim in Telegram
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
