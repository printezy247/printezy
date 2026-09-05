import { createFileRoute } from "@tanstack/react-router";

/**
 * Entitlement bridge for @ezytradeai_bot (tradernonymous/EzyAi).
 *
 *   GET  /api/public/ezyai/entitlements?username=<handle>
 *   GET  /api/public/ezyai/entitlements            (all unclaimed — sweep)
 *   POST /api/public/ezyai/entitlements  { id, telegram_id }
 *
 * Auth: `Authorization: Bearer <EZYAI_ENTITLEMENT_KEY>`. 503 while the key is
 * unset (nothing to compare against), 401 on a bad key. The bot activates
 * PRO locally between the GET and the POST, keyed on stripe_session_id so a
 * repeated GET can never grant a second period.
 */
async function guard(request: Request): Promise<Response | null> {
  if (!process.env.EZYAI_ENTITLEMENT_KEY) {
    return Response.json({ error: "entitlement bridge not configured" }, { status: 503 });
  }
  const { isAuthorizedBotRequest } = await import("@/lib/ezyai/entitlements.server");
  if (!isAuthorizedBotRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export const Route = createFileRoute("/api/public/ezyai/entitlements")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await guard(request);
        if (denied) return denied;
        try {
          const username = new URL(request.url).searchParams.get("username");
          const { listUnclaimedEntitlements } = await import("@/lib/ezyai/entitlements.server");
          const entitlements = await listUnclaimedEntitlements(username);
          return Response.json({ entitlements });
        } catch (error) {
          console.error("[ezyai entitlements] GET failed", error);
          return Response.json({ error: "lookup failed" }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        const denied = await guard(request);
        if (denied) return denied;
        try {
          const body = (await request.json().catch(() => null)) as {
            id?: unknown;
            telegram_id?: unknown;
          } | null;
          const id = typeof body?.id === "string" ? body.id : "";
          const telegramId = Number(body?.telegram_id);
          if (
            !/^[0-9a-f-]{36}$/i.test(id) ||
            !Number.isSafeInteger(telegramId) ||
            telegramId <= 0
          ) {
            return Response.json(
              { error: "id (uuid) and telegram_id (int) required" },
              { status: 400 },
            );
          }
          const { claimEntitlement } = await import("@/lib/ezyai/entitlements.server");
          const entitlement = await claimEntitlement(id, telegramId);
          return Response.json({ claimed: entitlement !== null, entitlement });
        } catch (error) {
          console.error("[ezyai entitlements] POST failed", error);
          return Response.json({ error: "claim failed" }, { status: 500 });
        }
      },
    },
  },
});
