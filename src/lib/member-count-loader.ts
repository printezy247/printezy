/**
 * Resolve the member count for a route loader without ever blocking or
 * failing the page: a slow, failing or nonsensical answer becomes `fallback`.
 */
export async function loadMemberCount(
  fetchCount: () => Promise<number>,
  timeoutMs: number,
  fallback: number,
): Promise<number> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const count = await Promise.race([
      fetchCount(),
      new Promise<number>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
    return Number.isFinite(count) && count > 0 ? count : fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
