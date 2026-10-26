import { useTranslation } from "@/lib/i18n";
import type { EzyAiHistory } from "@/lib/ezyai/signals.functions";
import { PanelError } from "./PanelError";
import { PerformancePanel } from "./PerformancePanel";

/** The slice of the query result the panel actually reads. */
export type HistoryQuery = {
  data?: EzyAiHistory;
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
};

/** The history tab: the closed-trade summary and the list behind it. */
export function HistoryPanel({ history }: { history: HistoryQuery }) {
  const { t } = useTranslation();

  return (
    <section
      id="ezyai-panel-history"
      role="tabpanel"
      aria-labelledby="ezyai-tab-history"
      aria-busy={history.isLoading}
      className="mt-8"
    >
      <h2 className="text-2xl">{t("ezyai_sig_history_title")}</h2>
      <div className="mt-6">
        {history.isError ? (
          <PanelError
            message={t("ezyai_load_failed")}
            retryLabel={t("ezyai_retry")}
            onRetry={() => void history.refetch()}
          />
        ) : history.data ? (
          <PerformancePanel performance={history.data.performance} signals={history.data.signals} />
        ) : (
          <p
            role="status"
            className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground"
          >
            …
          </p>
        )}
      </div>
    </section>
  );
}
