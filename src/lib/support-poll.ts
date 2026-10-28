/** A row from the support-message poll. */
export type PolledRow = { id: number; role: string; author: string; text: string };

/**
 * Add Sarah's new replies to the bubbles on screen. Rows already shown (same
 * id) are skipped, so two overlapping polls can never show a reply twice.
 */
export function mergeInbound<B extends { id: number }>(
  prev: B[],
  rows: PolledRow[],
): (B | { id: number; role: "sarah"; author: string; text: string })[] {
  const seen = new Set(prev.map((m) => m.id));
  const fresh = rows
    .filter((r) => r.role === "sarah" && r.author === "Sarah" && !seen.has(r.id))
    .map((r) => ({ id: r.id, role: "sarah" as const, author: r.author, text: r.text }));
  return fresh.length ? [...prev, ...fresh] : prev;
}
