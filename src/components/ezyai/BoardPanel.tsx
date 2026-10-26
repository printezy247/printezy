import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { formatLocalTime } from "@/lib/local-time";
import type { EzyAiBoard } from "@/lib/ezyai/signals.functions";
import { PanelError } from "./PanelError";
import { SignalCard } from "./SignalCard";

/** The slice of the query result the panel actually reads. */
export type BoardQuery = {
  data?: EzyAiBoard;
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
};

/**
 * The live tab: the cards the bot pushed, the "as of" line, and whether the
 * stream doorbell is connected or the 30s poll is carrying the board.
 */
export function BoardPanel({ board, streamLive }: { board: BoardQuery; streamLive: boolean }) {
  const { t } = useTranslation();

  // Announce board changes to screen readers: a polite live region that fires
  // whenever the rendered signal count changes (a card opened, closed or
  // changed), without stealing focus. The timestamp is the same "as of" line
  // the sighted view shows.
  const [announcement, setAnnouncement] = useState("");
  const lastAnnounced = useRef("");
  useEffect(() => {
    const data = board.data;
    if (!data) return;
    const signature = `${data.signals.length}:${data.updatedAt ?? ""}`;
    if (signature === lastAnnounced.current) return;
    // First load is not an "update" — the panel appearing is announcement enough.
    if (lastAnnounced.current !== "") {
      setAnnouncement(
        data.updatedAt
          ? t("ezyai_sig_updated").replace("{time}", formatLocalTime(new Date(data.updatedAt)))
          : t("ezyai_sig_empty"),
      );
    }
    lastAnnounced.current = signature;
  }, [board.data, t]);

  return (
    <section
      id="ezyai-panel-live"
      role="tabpanel"
      aria-labelledby="ezyai-tab-live"
      aria-busy={board.isLoading}
      className="mt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">{t("ezyai_sig_title")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-body">{t("ezyai_sig_desc")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {board.data?.updatedAt ? (
            <p>
              {t("ezyai_sig_updated").replace(
                "{time}",
                formatLocalTime(new Date(board.data.updatedAt)),
              )}
            </p>
          ) : null}
          <p className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${streamLive ? "bg-green" : "bg-muted-foreground/50"}`}
            />
            {t(streamLive ? "ezyai_stream_live" : "ezyai_stream_poll")}
          </p>
        </div>
      </div>

      <p className="mt-3 inline-flex rounded-md border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs text-body">
        {t("ezyai_sig_exclusive")}
      </p>

      {/* Screen-reader channel for board changes; visually hidden. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {board.isError ? (
        <PanelError
          message={t("ezyai_load_failed")}
          retryLabel={t("ezyai_retry")}
          onRetry={() => void board.refetch()}
        />
      ) : board.data && board.data.signals.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {board.data.signals.map((signal, i) => (
            <SignalCard key={signal.id} signal={signal} index={i} />
          ))}
        </div>
      ) : (
        <p
          role="status"
          className="mt-6 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground"
        >
          {board.isLoading ? "…" : t("ezyai_sig_empty")}
        </p>
      )}
    </section>
  );
}
