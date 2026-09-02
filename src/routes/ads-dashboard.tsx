import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getAdDashboard, type AdDashboard } from "@/lib/ads.functions";

export const Route = createFileRoute("/ads-dashboard")({
  head: () => ({
    meta: [
      { title: "Ad Performance Dashboard | PrintEzy" },
      {
        name: "description",
        content:
          "Private dashboard showing Meta ad clicks, UTM campaigns and the enrollments they generated.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Ad Performance Dashboard | PrintEzy" },
      {
        property: "og:description",
        content: "Private view of Meta ad clicks and tier conversions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdsDashboardPage,
});

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "usd").toUpperCase() })
    .format(cents / 100);

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

function AdsDashboardPage() {
  const load = useServerFn(getAdDashboard);
  const [key, setKey] = useState("");
  const [data, setData] = useState<AdDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setData(await load({ data: { key } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the dashboard.");
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Ad performance</h1>
          <p className="text-sm text-muted-foreground">
            Meta ad clicks matched to enrollments by session.
          </p>
        </header>

        {!data && (
          <form onSubmit={submit} className="flex max-w-md flex-col gap-3">
            <label htmlFor="key" className="text-sm text-muted-foreground">
              Dashboard passphrase
            </label>
            <input
              id="key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter passphrase"
            />
            <button
              type="submit"
              disabled={busy || key.length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Loading…" : "Open dashboard"}
            </button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        )}

        {data && (
          <div className="space-y-10">
            <section className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Ad clicks", value: String(data.totals.clicks) },
                { label: "Enrollments", value: String(data.totals.enrollments) },
                { label: "Paid", value: String(data.totals.paid) },
                {
                  label: "Revenue",
                  value: money(data.totals.revenueCents, data.campaigns[0]?.currency ?? "usd"),
                },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-5">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{s.value}</div>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">By campaign</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Campaign</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Clicks</th>
                      <th className="px-4 py-3">Enrollments</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((c) => (
                      <tr key={`${c.source}-${c.campaign}`} className="border-t border-border">
                        <td className="px-4 py-3">{c.campaign}</td>
                        <td className="px-4 py-3">{c.source}</td>
                        <td className="px-4 py-3">{c.clicks}</td>
                        <td className="px-4 py-3">{c.enrollments}</td>
                        <td className="px-4 py-3">{c.paid}</td>
                        <td className="px-4 py-3">{money(c.revenueCents, c.currency)}</td>
                      </tr>
                    ))}
                    {data.campaigns.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                          No ad clicks recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Recent clicks</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Clicked</th>
                      <th className="px-4 py-3">fbclid</th>
                      <th className="px-4 py-3">Campaign</th>
                      <th className="px-4 py-3">Medium</th>
                      <th className="px-4 py-3">Landing</th>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.sessionId + r.createdAt} className="border-t border-border">
                        <td className="whitespace-nowrap px-4 py-3">{when(r.createdAt)}</td>
                        <td className="max-w-[180px] truncate px-4 py-3 font-mono text-xs">
                          {r.fbclid ?? "—"}
                        </td>
                        <td className="px-4 py-3">{r.utmCampaign ?? "—"}</td>
                        <td className="px-4 py-3">{r.utmMedium ?? "—"}</td>
                        <td className="px-4 py-3">{r.landingPath ?? "—"}</td>
                        <td className="px-4 py-3">{r.tier ?? "—"}</td>
                        <td className="px-4 py-3">{r.status ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{when(r.enrolledAt)}</td>
                      </tr>
                    ))}
                    {data.rows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-muted-foreground">
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
