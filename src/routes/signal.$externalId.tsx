import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Nav, Footer } from "@/components/landing/SiteChrome";
import { useTranslation } from "@/lib/i18n";
import { localizedHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/bot/tiers";
import { goTrack } from "@/lib/analytics";
import { getEzyAiSignal } from "@/lib/ezyai/signals.functions";
import { liveR, progressPercent, entryMid } from "@/lib/ezyai/signals";

export const Route = createFileRoute("/signal/$externalId")({
  head: () => ({
    ...localizedHead({
      path: "/ezyai",
      locale: "en",
      title: "Signal detail — EzyAI",
      description: "One autopilot signal: entry, stop, targets and live R.",
      image: "default",
      crumbName: "Signal",
    }),
    // Per-signal deep links are member content shared in chat, not site
    // pages — robots.txt alone can't stop an index, only this can.
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: EzyAiSignalDetail,
});

function EzyAiSignalDetail() {
  const { externalId } = Route.useParams();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const fetchSignal = useServerFn(getEzyAiSignal);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ezyai-signal", externalId],
    queryFn: () => fetchSignal({ data: { externalId } }),
    staleTime: 20_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const signal = data?.signal ?? null;
  const r = signal ? liveR(signal) : null;
  const target = signal?.tp1 ?? signal?.tp2 ?? null;
  const progress = signal
    ? progressPercent(signal.lastPrice, signal.stopPrice, target, signal.direction)
    : null;
  const entry = signal ? entryMid(signal) : null;
  const entryAt = signal
    ? progressPercent(entry, signal.stopPrice, target, signal.direction)
    : null;
  const pageUrl = `${SITE_URL}/signal/${encodeURIComponent(externalId)}`;
  const shareText = signal
    ? `${signal.symbol} ${signal.direction.toUpperCase()} — EzyAI signal`
    : "EzyAI signal";
  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopyFailed(false);
      setCopied(true);
      goTrack("signal_copy_link");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions, insecure context) — say so and point
      // at the Telegram share link, which needs no clipboard access.
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 4000);
    }
  };

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
        {isLoading ? (
          <div className="mt-6 space-y-3" role="status" aria-label="Loading signal">
            <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 animate-pulse rounded-md bg-muted" />
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-2 animate-pulse rounded-full bg-muted" />
          </div>
        ) : null}
        {!isLoading && isError ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-5 text-sm">
            <p className="font-semibold">Couldn’t load this signal.</p>
            <p className="mt-1 text-muted-foreground">
              Check your connection, then try again — or return to the live board.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                Try again
              </button>
              <Link
                to="/ezyai"
                search={{ tab: "live" }}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                Back to live board
              </Link>
            </div>
          </div>
        ) : null}
        {!isLoading && !isError && !signal ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-5 text-sm">
            <p className="font-semibold">No signal found for {externalId}.</p>
            <p className="mt-1 text-muted-foreground">
              It may be closed and archived, or the link is stale. The live board has what’s running
              now.
            </p>
            <Link
              to="/ezyai"
              search={{ tab: "live" }}
              className="mt-3 inline-block rounded-md border border-border px-3 py-2 text-sm"
            >
              Back to live board
            </Link>
          </div>
        ) : null}
        {signal ? (
          <>
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
            <div className="mt-6">
              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progress ?? 0}%` }}
                />
                {entryAt != null ? (
                  <span
                    className="absolute top-0 h-full w-0.5 bg-foreground/70"
                    style={{ left: `${entryAt}%` }}
                  />
                ) : null}
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Stop {signal.stopPrice ?? "—"}</span>
                <span>Target {target ?? "—"}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyLink}
                aria-live="polite"
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                {copyFailed ? "Copy failed — use Telegram share" : copied ? "Copied!" : "Copy link"}
              </button>
              <a
                href={telegramShare}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("signal_share_telegram")}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                Share on Telegram
              </a>
            </div>
          </>
        ) : null}
        <p className="mt-6 text-xs text-muted-foreground">
          Live R is derived from the last reported price and never stored, so a stale row can never
          show a stale profit.
        </p>
      </main>
      <Footer />
    </div>
  );
}
