/**
 * Lightweight fixed-window rate limiter for public server functions that
 * have no auth gate (guest checkout, lead capture, support chat). Keyed by
 * an app-chosen id (usually the analytics session id) plus an endpoint
 * name, incremented atomically via the increment_rate_limit RPC so
 * concurrent requests can't race past the limit.
 */
export async function checkRateLimit(
  endpoint: string,
  identifier: string,
  opts: { max: number; windowMs: number },
): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const windowStart = new Date(Math.floor(Date.now() / opts.windowMs) * opts.windowMs);
  const bucketKey = `${endpoint}:${identifier}:${windowStart.toISOString()}`;

  const { data, error } = await supabaseAdmin.rpc("increment_rate_limit", {
    p_bucket_key: bucketKey,
    p_window_start: windowStart.toISOString(),
  });

  if (error) {
    // Fail open: a rate-limit outage should never take down checkout/leads/chat.
    console.error("[rate-limit] check failed, allowing request", error);
    return true;
  }

  return (data as number) <= opts.max;
}
