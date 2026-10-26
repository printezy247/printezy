import { Button } from "@/components/ui/button";

/**
 * One failure view for both board panels: what happened, and a way to try
 * again. A failed read is not the same thing as an empty board, so it gets its
 * own alert rather than the "no signals yet" copy.
 */
export function PanelError({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-6 rounded-xl border border-border bg-card p-8 text-center text-sm"
    >
      <p className="text-body">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
