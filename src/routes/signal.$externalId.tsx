import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Nav, Footer } from "@/components/landing/Landing";
import { useTranslation } from "@/lib/i18n";
import { localizedHead } from "@/lib/seo";
import { getEzyAiSignal } from "@/lib/ezyai/signals.functions";
import { liveR, progressPercent, entryMid } from "@/lib/ezyai/signals";

export const Route = createFileRoute("/signal/$externalId")({
  head: () =>
    localizedHead({
      path: "/ezyai",
      locale: "en",
      title: "Signal detail — EzyAI",
      description: "One autopilot signal: entry, stop, targets and live R.",
      image: "default",
      crumbName: "Signal",
    }),
  component: EzyAiSignalDetail,
});

function EzyAiSignalDetail() {
  const { externalId } = Route.useParams();
  const { t } = useTranslation();
  const fetchSignal = useServerFn(getEzyAiSignal);
  const { data, isLoading } = useQuery({
    queryKey: ["ezyai-signal", externalId],
    queryFn: () => fetchSignal({ data: { externalId } }),
  });

  const signal = data?.signal ?? null;
  const r = signal ? liveR(signal) : null;
  const progress = signal
    ? progressPercent(signal.lastPrice, signal.stopPrice, signal.tp1, signal.direction)
    : null;
  const entry = signal ? entryMid(signal) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link to="/ezyai" search={{ tab: "live" }} className="text-sm text-muted-foreground">
          ← {t("ezyai_tab_live")}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          {signal ? `${signal.symbol} ${signal.direction.toUpperCase()}` : externalId}
        </h1>
        {isLoading ? <p className="mt-4 text-sm">Loading…</p> : null}
        {!isLoading && !signal ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No signal found for {externalId}. It may be closed and archived, or the link is stale.
          </p>
        ) : null}
        {signal ? (
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-mono">{signal.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Entry</dt>
              <dd className="font-mono">{entry ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stop</dt>
              <dd className="font-mono">{signal.stopPrice ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">TP1 / TP2</dt>
              <dd className="font-mono">
                {signal.tp1 ?? "—"} / {signal.tp2 ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Live R</dt>
              <dd className="font-mono">{r != null ? r.toFixed(2) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Progress</dt>
              <dd className="font-mono">{progress != null ? `${progress.toFixed(0)}%` : "—"}</dd>
            </div>
          </dl>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
