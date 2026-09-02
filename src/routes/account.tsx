import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react";

import { getAccount } from "@/lib/account.functions";
import { formatPrice } from "@/lib/bot/tiers";
import { LINKS } from "@/components/landing/Landing";

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>) => ({
    t: typeof search.t === "string" ? search.t : "",
    canceled: search.canceled === "1" || search.canceled === 1,
  }),
  head: () => ({
    meta: [
      { title: "My Account — EzyMap ALGO Enrollment Status" },
      {
        name: "description",
        content:
          "View your EzyMap ALGO enrollment: package, payment status, activation date and your member access links.",
      },
      { property: "og:title", content: "My Account — EzyMap ALGO" },
      {
        property: "og:description",
        content: "Your EzyMap ALGO package, payment status and member access links.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { t, canceled } = Route.useSearch();
  const fetchAccount = useServerFn(getAccount);

  const { data, isLoading } = useQuery({
    queryKey: ["account", t],
    queryFn: () => fetchAccount({ data: { token: t } }),
    enabled: t.length >= 8,
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 5000 : false),
  });

  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          to="/"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← EzyMap ALGO
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          My account
        </h1>

        {t.length < 8 ? (
          <Panel>
            <p className="text-sm text-muted-foreground">
              This page opens from your personal link in the enrollment bot. Start the bot
              and it will send you your account link.
            </p>
            <BotButton />
          </Panel>
        ) : isLoading ? (
          <Panel>
            <p className="text-sm text-muted-foreground">Loading your enrollment…</p>
          </Panel>
        ) : !data?.found ? (
          <Panel>
            <p className="text-sm text-muted-foreground">
              We couldn't find an enrollment for this link. It may have expired — open the
              bot and request a fresh account link.
            </p>
            <BotButton />
          </Panel>
        ) : (
          <>
            {canceled && data.status === "pending" ? (
              <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-foreground">
                Payment was cancelled. Your spot is still reserved — reopen the bot to
                finish checkout.
              </div>
            ) : null}

            <Panel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Package
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{data.tierName}</p>
                </div>
                <StatusBadge status={data.status ?? "pending"} />
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <Row label="Member">
                  {data.memberName ?? "—"}
                  {data.memberHandle ? (
                    <span className="text-muted-foreground"> (@{data.memberHandle})</span>
                  ) : null}
                </Row>
                <Row label="Price">
                  {formatPrice(data.amountCents ?? 0, data.currency ?? "usd")}
                </Row>
                <Row label="Enrolled">{formatDate(data.createdAt)}</Row>
                <Row label="Activated">
                  {data.activatedAt ? formatDate(data.activatedAt) : "Awaiting payment"}
                </Row>
              </dl>

              {data.perks?.length ? (
                <div className="mt-6 border-t border-border/60 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    What's included
                  </p>
                  <ul className="mt-3 space-y-2">
                    {data.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Panel>

            <Panel>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Your access
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {data.status === "active" ? (
                  <AccessLink href={LINKS.freeChannel}>Open the channel</AccessLink>
                ) : null}
                <AccessLink href={LINKS.bot}>Open the bot</AccessLink>
                <AccessLink href={LINKS.support}>Contact support</AccessLink>
              </div>
              {data.status === "pending" ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  This page refreshes itself — as soon as your payment clears, your access
                  links appear here and the bot messages you.
                </p>
              ) : null}
            </Panel>
          </>
        )}
      </div>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="glass-card mt-6 rounded-2xl p-6">{children}</section>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "active" | "canceled" }) {
  const map = {
    active: {
      Icon: CheckCircle2,
      text: "Active",
      cls: "border-primary/40 bg-primary/10 text-primary",
    },
    pending: {
      Icon: Clock,
      text: "Awaiting payment",
      cls: "border-accent/40 bg-accent/10 text-accent",
    },
    canceled: {
      Icon: XCircle,
      text: "Cancelled",
      cls: "border-border bg-muted/20 text-muted-foreground",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${map.cls}`}
    >
      <map.Icon className="h-3.5 w-3.5" />
      {map.text}
    </span>
  );
}

function AccessLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function BotButton() {
  return (
    <a
      href={LINKS.bot}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
    >
      Open the enrollment bot
    </a>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
