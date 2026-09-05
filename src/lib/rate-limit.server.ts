import { getRequest } from "@tanstack/react-start/server";

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
  const windowStart = new Date(Math.floor(Date.now() / opts.windowMs) * opts.windowMs);

  // The caller-supplied identifier (usually the browser's analytics session
  // id) is trivially rotated, so every check is also bucketed on the client
  // IP with a looser cap. Either bucket over its limit rejects the request.
  const ip = clientIp();
  const checks = [
    bump(`${endpoint}:${identifier}:${windowStart.toISOString()}`, windowStart, opts.max),
  ];
  if (ip)
    checks.push(
      bump(
        `${endpoint}:ip:${ip}:${windowStart.toISOString()}`,
        windowStart,
        opts.max * IP_MULTIPLIER,
      ),
    );
  const results = await Promise.all(checks);
  return results.every(Boolean);
}

/** One IP may legitimately host several sessions (office NAT, family). */
const IP_MULTIPLIER = 5;

function clientIp(): string | null {
  try {
    const headers = getRequest().headers;
    const ip =
      headers.get("cf-connecting-ip") ??
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    return ip && ip.length <= 64 ? ip : null;
  } catch {
    return null; // no request in scope (tests, scripts)
  }
}

async function bump(bucketKey: string, windowStart: Date, max: number): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("increment_rate_limit", {
    p_bucket_key: bucketKey,
    p_window_start: windowStart.toISOString(),
  });

  if (error) {
    // Fail open: a rate-limit outage should never take down checkout/leads/chat.
    console.error("[rate-limit] check failed, allowing request", error);
    return true;
  }

  return (data as number) <= max;
}
