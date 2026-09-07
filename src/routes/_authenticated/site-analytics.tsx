import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getEventSummary, getCampaignEngagement, type CampaignEngagementRow } from "@/lib/analytics.functions";
import { getSupportInboxHealth, type SupportInboxHealth } from "@/lib/admin.functions";
import { AdminGate } from "@/components/AdminGate";

export const Route = createFileRoute("/_authenticated/site-analytics")({
  head: () => ({
    meta: [
      { title: "Site Analytics | PrintEzy" },
      {
        name: "description",
        content: "Private dashboard showing scroll depth, engagement and top on-site events.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminGate>
      <SiteAnalyticsPage />
    </AdminGate>
  ),
});

type SummaryRow = { event_type: string; event_name: string; total: number };

/**
 * Every notice the site sends Sarah goes to one Telegram chat. A wrong chat id
 * fails silently, so this is the readout that makes it impossible to miss.
 */
function SupportInboxCard() {
  const load = useServerFn(getSupportInboxHealth);
  const [health, setHealth] = useState<SupportInboxHealth | null>(null);

  useEffect(() => {
    let active = true;
    void load({ data: undefined })
      .then((h) => {
        if (active) setHealth(h);
      })
      .catch(() => {
        // The card is a diagnostic; it must never break the page.
      });
    return () => {
      active = false;
    };
  }, [load]);

  if (!health) return null;

  if (health.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        Support inbox reachable — Telegram chat <span className="font-mono">{health.chatId}</span>.
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-destructive/50 bg-destructive/5 p-5">
      <h2 className="text-lg font-semibold text-destructive">Support inbox is not delivering</h2>
      <p className="mt-2 text-sm text-body">
        Messages to Sarah are failing, so ebook approval requests, website chat relays and purchase
        notices are not reaching her. Visitors are being shown a direct Telegram link instead.
      </p>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Chat id in use</dt>
          <dd className="font-mono">{health.chatId ?? "not registered"}</dd>
        </div>
        {health.source ? (
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Failing send</dt>
            <dd>{health.source}</dd>
          </div>
        ) : null}
        {health.failedAt ? (
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Last failure</dt>
            <dd>{new Date(health.failedAt).toLocaleString()}</dd>
          </div>
        ) : null}
        {health.detail ? (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Telegram said</dt>
            <dd className="font-mono text-xs break-words">{health.detail}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">
        Usual cause is a wrong chat id. Compare the value above with{" "}
        <span className="font-mono">bot_users.telegram_id</span> for{" "}
        <span className="font-mono">ezysarah</span>, which Telegram itself wrote, and correct{" "}
        <span className="font-mono">support_config.sarah_chat_id</span> to match. The next
        successful send clears this card.
      </p>
    </section>
  );
}

const SCROLL_STEPS = ["scroll_25", "scroll_50", "scroll_75", "scroll_90"];
const ENGAGEMENT_EVENTS = ["engaged_15s", "engaged_scroll"];

function totalFor(rows: SummaryRow[], eventName: string): number {
  return rows.find((r) => r.event_name === eventName)?.total ?? 0;
}

function SiteAnalyticsPage() {
  const load = useServerFn(getEventSummary);
  const loadCampaigns = useServerFn(getCampaignEngagement);
  const [rows, setRows] = useState<SummaryRow[] | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignEngagementRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    let active = true;
    void load({ data: { days } })
      .then((res) => {
        if (active) setRows(res.summary as SummaryRow[]);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load analytics.");
      });
    void loadCampaigns({ data: { days } })
      .then((res) => {
        if (active) setCampaigns(res.rows);
      })
      .catch(() => {
        if (active) setCampaigns([]);
      });
    return () => {
      active = false;
    };
  }, [load, loadCampaigns, days]);

  const pageLoads = rows ? totalFor(rows, "landing") : 0;
  const otherEvents = rows
    ? rows.filter((r) => !SCROLL_STEPS.includes(r.event_name) && !ENGAGEMENT_EVENTS.includes(r.event_name))
    : [];

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl tracking-tight">Site analytics</h1>
            <p className="text-sm text-muted-foreground">
              Scroll depth, engagement and raw event counts from on-site tracking.
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  days === d
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </header>

        <SupportInboxCard />

        {error && <p className="text-sm text-destructive">{error}</p>}
        {!rows && !error && <p className="text-sm text-muted-foreground">Loading…</p>}

        {rows && (
          <div className="space-y-10">
            <section className="space-y-3">
              <h2 className="text-xl ">Scroll depth</h2>
              <p className="text-sm text-muted-foreground">
                Share of homepage loads ({pageLoads}) that scrolled past each milestone.
              </p>
              <div className="grid gap-4 sm:grid-cols-4">
                {SCROLL_STEPS.map((step) => {
                  const total = totalFor(rows, step);
                  const pct = pageLoads > 0 ? Math.round((total / pageLoads) * 100) : 0;
                  return (
                    <div key={step} className="rounded-xl border border-border bg-card p-5">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {step.replace("scroll_", "")}% scrolled
                      </div>
                      <div className="mt-2 text-2xl font-semibold">{pct}%</div>
                      <div className="mt-1 text-xs text-muted-foreground">{total} sessions</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl ">Engagement</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {ENGAGEMENT_EVENTS.map((name) => (
                  <div key={name} className="rounded-xl border border-border bg-card p-5">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {name === "engaged_15s" ? "Engaged — stayed 15s+" : "Engaged — scrolled 50%+"}
                    </div>
                    <div className="mt-2 text-2xl font-semibold">{totalFor(rows, name)}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl ">By campaign</h2>
              <p className="text-sm text-muted-foreground">
                Only sessions tagged with a UTM/fbclid ad click — organic visits aren't attributed to a campaign.
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Campaign</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Page loads</th>
                      <th className="px-4 py-3">Scrolled 50%+</th>
                      <th className="px-4 py-3">Engaged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(campaigns ?? []).map((c) => (
                      <tr key={`${c.source}-${c.campaign}`} className="border-t border-border">
                        <td className="px-4 py-3">{c.campaign}</td>
                        <td className="px-4 py-3">{c.source}</td>
                        <td className="px-4 py-3">{c.pageLoads}</td>
                        <td className="px-4 py-3">
                          {c.pageLoads > 0 ? Math.round((c.scroll50 / c.pageLoads) * 100) : 0}%
                        </td>
                        <td className="px-4 py-3">
                          {c.pageLoads > 0 ? Math.round((c.engaged / c.pageLoads) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                    {(campaigns ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                          No campaign-attributed sessions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl ">All other events</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherEvents.map((r) => (
                      <tr key={`${r.event_type}-${r.event_name}`} className="border-t border-border">
                        <td className="px-4 py-3">{r.event_type}</td>
                        <td className="px-4 py-3">{r.event_name}</td>
                        <td className="px-4 py-3">{r.total}</td>
                      </tr>
                    ))}
                    {otherEvents.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-muted-foreground">
                          Nothing tracked yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
